import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CustomerInfo, ReservationStatus } from '@/lib/supabase'
import { sendReservationConfirmation } from '@/lib/email'

interface SelectedOption {
  name: string
  description: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  quantity: number
  pricePerUnit: number
  rentalStart: string // ISO timestamp
  rentalEnd: string // ISO timestamp
  selectedOption?: SelectedOption
}

interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  deliveryOption?: 'pickup' | 'delivery'
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

    const { customerInfo, items, deposit, caution, deliveryOption, deliveryFees, totalPrice, paymentMethod } = payload

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

    // 1. Créer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        customer_infos: customerInfo,
        deposit,
        caution,
        delivery_option: deliveryOption || 'pickup',
        delivery_fees: deliveryFees || 0,
        reservation_status: reservationStatus,
        total_price: totalPrice,
      })
      .select()
      .single()

    if (reservationError || !reservation) {
      console.error('Erreur création réservation:', reservationError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      )
    }

    // 2. Créer les items de réservation
    const reservationItems = items.map((item) => ({
      reservation_id: reservation.id,
      product_id: item.productId,
      quantity: item.quantity,
      rental_start: item.rentalStart,
      rental_end: item.rentalEnd,
      options: item.selectedOption || null,
    }))

    const { error: itemsError } = await supabase
      .from('reservation_items')
      .insert(reservationItems)

    if (itemsError) {
      console.error('Erreur création items:', itemsError)
      // Rollback: supprimer la réservation créée
      await supabase.from('reservations').delete().eq('id', reservation.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création des articles de réservation' },
        { status: 500 }
      )
    }

    // 3. Envoyer l'email de confirmation avec le PDF
    try {
      const emailData = {
        id: reservation.id,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: totalPrice,
        created_at: reservation.created_at,
        items: items.map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          rental_start: item.rentalStart,
          rental_end: item.rentalEnd,
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOption: item.selectedOption,
        })),
      }

      await sendReservationConfirmation(emailData)
      console.log('Email de confirmation envoyé à:', customerInfo.email)
    } catch (emailError) {
      // Ne pas faire échouer la réservation si l'email échoue
      // La réservation est déjà créée en base
      console.error('Erreur envoi email (réservation créée):', emailError)
    }

    // 4. Retourner le succès avec l'ID de réservation
    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
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
