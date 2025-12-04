import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CustomerInfo, ReservationStatus, TimeSlot } from '@/lib/supabase'
import { sendReservationConfirmation } from '@/lib/email'
import { generateReservationCode } from '@/lib/reservation-code'
import { format } from 'date-fns'

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  category: string // 'locations', 'accessoires-personnalises', or 'henne'
  quantity: number
  pricePerUnit: number
  rentalStart: string // ISO timestamp (dummy for purchase/prestation items)
  rentalEnd: string // ISO timestamp (dummy for purchase/prestation items)
  prestationDate?: string // ISO timestamp for prestation date
  prestationTimeSlot?: TimeSlot // Time slot ENUM: 'LUNCH' | 'AFTERNOON' | 'EVENING'
  selectedOptions?: SelectedOption[] // Array of selected options
  personalizations?: { [key: string]: string } // Map of personalization field name to value
  needsInstallation?: boolean
  installationFees?: number
}

interface ReservationItemOptions {
  selectedOptions?: SelectedOption[]
  installationFees?: number
}

interface DeliveryInfo {
  option: 'pickup' | 'delivery' | 'relay_point'
  address?: string
  fees: number
  distance?: number
}

interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  rentalDelivery?: DeliveryInfo // Delivery info for rental items
  purchaseDelivery?: DeliveryInfo // Delivery info for purchase items
  prestationDelivery?: DeliveryInfo // Delivery info for prestation items
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

    const { customerInfo, items, deposit, caution, rentalDelivery, purchaseDelivery, prestationDelivery, totalPrice, paymentMethod } = payload

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

    // Déterminer le statut de la réservation en fonction du mode de paiement
    let reservationStatus: ReservationStatus
    if (paymentMethod === 'online' && deposit > 0) {
      // Paiement en ligne effectué (simulation) - l'acompte est considéré comme payé
      reservationStatus = 'CONFIRMED'
    } else if (paymentMethod === 'cash' && deposit > 0) {
      // Réservation avec acompte non payé (à payer en espèces en boutique)
      reservationStatus = 'CONFIRMED_NO_DEPOSIT'
    } else if (deposit === 0) {
      // Pas d'acompte requis
      reservationStatus = 'CONFIRMED_NO_DEPOSIT'
    } else {
      // Par défaut
      reservationStatus = 'CONFIRMED_NO_DEPOSIT'
    }

    // 1. Créer la commande client (customer_order)
    const reservationCode = generateReservationCode()

    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: customerInfo,
        total_price: totalPrice,
        order_number: reservationCode,
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

    // 2. Séparer les items par type (rental vs purchase vs prestation)
    const rentalItems = items.filter(item => item.category === 'locations')
    const purchaseItems = items.filter(item => item.category === 'accessoires-personnalises')
    const prestationItems = items.filter(item => item.category === 'henne')

    let rentalReservationId: number | null = null
    let purchaseReservationId: number | null = null
    let prestationReservationId: number | null = null

    // 3a. Créer rental_reservation si nécessaire
    if (rentalItems.length > 0) {
      const { data: rentalReservation, error: reservationError } = await supabase
        .from('rental_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          deposit,
          caution,
          delivery_address: rentalDelivery?.option === 'delivery' ? (rentalDelivery.address || null) : null,
          delivery_fees: rentalDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: rentalItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0),
        })
        .select()
        .single()

      if (reservationError || !rentalReservation) {
        console.error('Erreur création rental_reservation:', reservationError)
        // Rollback: supprimer la commande créée (la FK cascade supprimera aussi)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation location' },
          { status: 500 }
        )
      }

      rentalReservationId = rentalReservation.id

      // Créer les rental_items
      const rentalItemsData = rentalItems.map((item) => {
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
        .insert(rentalItemsData)

      if (itemsError) {
        console.error('Erreur création rental_items:', itemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles de location' },
          { status: 500 }
        )
      }
    }

    // 3b. Créer purchase_reservation si nécessaire
    if (purchaseItems.length > 0) {
      const { data: purchaseReservation, error: purchaseError } = await supabase
        .from('purchase_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: purchaseDelivery?.option !== 'pickup' ? (purchaseDelivery?.address || null) : null,
          delivery_fees: purchaseDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: purchaseItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0),
        })
        .select()
        .single()

      if (purchaseError || !purchaseReservation) {
        console.error('Erreur création purchase_reservation:', purchaseError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation achat' },
          { status: 500 }
        )
      }

      purchaseReservationId = purchaseReservation.id

      // Créer les purchase_items
      const purchaseItemsData = purchaseItems.map((item) => {
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
          purchase_reservation_id: purchaseReservation.id,
          product_id: item.productId,
          quantity: item.quantity,
          estimated_delivery_date: null, // À définir plus tard
          options: optionsData,
          personalizations: item.personalizations || null,
        }
      })

      const { error: purchaseItemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItemsData)

      if (purchaseItemsError) {
        console.error('Erreur création purchase_items:', purchaseItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles d\'achat' },
          { status: 500 }
        )
      }
    }

    // 3c. Créer prestation_reservation si nécessaire
    if (prestationItems.length > 0) {
      const { data: prestationReservation, error: prestationError } = await supabase
        .from('prestation_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: prestationDelivery?.option === 'delivery' ? (prestationDelivery.address || null) : null,
          delivery_fees: prestationDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: prestationItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0),
        })
        .select()
        .single()

      if (prestationError || !prestationReservation) {
        console.error('Erreur création prestation_reservation:', prestationError)
        // Rollback : supprimer la commande client
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation de prestation' },
          { status: 500 }
        )
      }

      prestationReservationId = prestationReservation.id

      // Créer les prestation_items
      const prestationItemsData = prestationItems.map((item) => {
        let optionsData: ReservationItemOptions | null = null

        if (item.selectedOptions && item.selectedOptions.length > 0) {
          optionsData = {
            selectedOptions: item.selectedOptions,
          }
        }

        // Formater la date de prestation (DATE seulement, pas de timestamp)
        let prestationDateFormatted: string | null = null
        if (item.prestationDate) {
          const date = new Date(item.prestationDate)
          prestationDateFormatted = format(date, 'yyyy-MM-dd')
        }

        return {
          prestation_reservation_id: prestationReservationId,
          product_id: item.productId,
          quantity: item.quantity,
          prestation_date: prestationDateFormatted,
          time_slot: item.prestationTimeSlot || null,
          options: optionsData,
          personalizations: item.personalizations || null,
        }
      })

      const { error: prestationItemsError } = await supabase
        .from('prestation_items')
        .insert(prestationItemsData)

      if (prestationItemsError) {
        console.error('Erreur création prestation_items:', prestationItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles de prestation' },
          { status: 500 }
        )
      }
    }

    // 4. Envoyer l'email de confirmation avec le PDF
    try {
      // Construire les adresses de livraison pour l'email
      // Séparer les items en locations et achats pour l'email
      const rentalItems = items
        .filter((item) => item.category === 'locations')
        .map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          rental_start: item.rentalStart,
          rental_end: item.rentalEnd,
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const purchaseItems = items
        .filter((item) => item.category === 'accessoires-personnalises')
        .map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          estimated_delivery_date: item.rentalStart, // Utiliser rentalStart comme date estimée pour les achats
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const prestationItemsEmail = items
        .filter((item) => item.category === 'henne')
        .map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          prestation_date: item.prestationDate,
          time_slot: item.prestationTimeSlot,
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const emailData = {
        id: customerOrder.id, // Utiliser l'ID de la commande principale
        reservation_code: reservationCode,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: totalPrice,
        created_at: customerOrder.created_at,
        rentalItems: rentalItems.length > 0 ? rentalItems : undefined,
        purchaseItems: purchaseItems.length > 0 ? purchaseItems : undefined,
        prestationItems: prestationItemsEmail.length > 0 ? prestationItemsEmail : undefined,
        rentalDeliveryAddress: rentalDelivery?.option === 'delivery' ? rentalDelivery.address : null,
        rentalDeliveryFees: rentalDelivery?.fees || 0,
        purchaseDeliveryAddress: purchaseDelivery?.option === 'delivery' ? purchaseDelivery.address : null,
        purchaseDeliveryFees: purchaseDelivery?.fees || 0,
        prestationDeliveryAddress: prestationDelivery?.option === 'delivery' ? prestationDelivery.address : null,
        prestationDeliveryFees: prestationDelivery?.fees || 0,
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
      reservationCode: reservationCode,
      rentalReservationId: rentalReservationId,
      purchaseReservationId: purchaseReservationId,
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
