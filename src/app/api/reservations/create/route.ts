import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CustomerInfo, ReservationStatus } from '@/lib/supabase'
import { sendReservationConfirmation } from '@/lib/email'

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  quantity: number
  pricePerUnit: number
  rentalStart: string // ISO timestamp
  rentalEnd: string // ISO timestamp
  selectedOptions?: SelectedOption[] // Array of selected options
  personalizations?: { [key: string]: string } // Map of personalization field name to value
  needsInstallation?: boolean
  installationFees?: number
}

interface ReservationItemOptions {
  selectedOptions?: SelectedOption[]
  installationFees?: number
}

interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  deliveryOption?: 'pickup' | 'delivery' // Frontend sends 'pickup' or 'delivery'
  deliveryAddress?: string // Address if delivery option is 'delivery'
  deliveryFees?: number
  totalPrice: number
  paymentMethod?: 'online' | 'cash' | null
}

export async function POST(request: NextRequest) {
  try {
    const payload: CreateReservationPayload = await request.json()

    // Validation
    if (!payload.customerInfo || !payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { error: 'Données de réservation invalides' },
        { status: 400 }
      )
    }

    const { customerInfo, items, deposit, caution, deliveryOption, deliveryAddress, deliveryFees, totalPrice, paymentMethod } = payload

    // Create Supabase client with service_role key (bypasses RLS)
    // This is safe because:
    // 1. This code runs server-side only (never exposed to client)
    // 2. We validate all data before insertion
    // 3. RLS still protects direct database access from clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Déterminer le statut de la réservation
    // Si paiement en ligne choisi mais qu'on arrive ici, c'est qu'il y a eu un problème
    // Normalement, le paiement en ligne passe par l'API /process-payment
    let reservationStatus: ReservationStatus
    if (paymentMethod === 'cash' && deposit > 0) {
      // Réservation avec acompte non payé (à payer en espèces)
      reservationStatus = 'CONFIRMED_NO_DEPOSIT'
    } else if (deposit === 0) {
      // Pas d'acompte requis
      reservationStatus = 'CONFIRMED_NO_DEPOSIT'
    } else {
      // Acompte payé (ne devrait pas arriver ici car géré par /process-payment)
      reservationStatus = 'CONFIRMED'
    }

    // 1. Créer la commande client (customer_order)
    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: customerInfo,
        total_price: totalPrice,
        order_number: Date.now(), // Génération simple d'un numéro de commande (à améliorer plus tard)
      })
      .select()
      .single()

    if (orderError || !customerOrder) {
      console.error('Erreur création customer_order:', orderError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      )
    }

    // 2. Créer la rental_reservation (liée à customer_order)
    const { data: rentalReservation, error: reservationError } = await supabase
      .from('rental_reservations')
      .insert({
        customer_order_id: customerOrder.id,
        deposit,
        caution,
        delivery_address: deliveryOption === 'delivery' ? (deliveryAddress || null) : null,
        delivery_fees: deliveryFees || 0,
        reservation_status: reservationStatus,
        total_price: totalPrice,
      })
      .select()
      .single()

    if (reservationError || !rentalReservation) {
      console.error('Erreur création rental_reservation:', reservationError)
      // Rollback: supprimer la commande créée (la FK cascade supprimera aussi)
      await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      )
    }

    // 3. Créer les rental_items
    const rentalItems = items.map((item) => {
      // Build options object for selected options and installation fees only
      let optionsData: ReservationItemOptions | null = null

      if (item.selectedOptions && item.selectedOptions.length > 0) {
        optionsData = {
          selectedOptions: item.selectedOptions,
          installationFees: item.installationFees
        }
      } else if (item.installationFees) {
        optionsData = {
          installationFees: item.installationFees
        }
      }

      return {
        rental_reservation_id: rentalReservation.id,
        product_id: item.productId,
        quantity: item.quantity,
        rental_start: item.rentalStart,
        rental_end: item.rentalEnd,
        options: optionsData,
        personalizations: item.personalizations || null,
        needs_installation: item.needsInstallation || false,
      }
    })

    const { error: itemsError } = await supabase
      .from('rental_items')
      .insert(rentalItems)

    if (itemsError) {
      console.error('Erreur création rental_items:', itemsError)
      // Rollback: supprimer la commande (cascade supprimera rental_reservation et rental_items)
      await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création des articles de réservation' },
        { status: 500 }
      )
    }

    // 4. Envoyer l'email de confirmation avec le PDF
    try {
      const emailData = {
        id: rentalReservation.id,
        order_number: customerOrder.order_number,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: totalPrice,
        created_at: rentalReservation.created_at,
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress : null,
        delivery_fees: deliveryFees,
        items: items.map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          rental_start: item.rentalStart,
          rental_end: item.rentalEnd,
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        })),
      }

      await sendReservationConfirmation(emailData)
      console.log('Email de confirmation envoyé à:', customerInfo.email)
    } catch (emailError) {
      // Ne pas faire échouer la réservation si l'email échoue
      // La réservation est déjà créée en base
      console.error('Erreur envoi email (réservation créée):', emailError)
    }

    // 5. Retourner le succès avec les IDs
    return NextResponse.json({
      success: true,
      orderId: customerOrder.id,
      orderNumber: customerOrder.order_number,
      reservationId: rentalReservation.id,
      message: 'Réservation créée avec succès',
    })
  } catch (error) {
    console.error('Erreur API /api/reservations/create:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
