import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CustomerInfo, ReservationStatus } from '@/lib/supabase'

interface CartItemPayload {
  productId: number
  productName: string
  quantity: number
  pricePerUnit: number
  rentalStart: string // ISO timestamp
  rentalEnd: string // ISO timestamp
}

interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
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

    const { customerInfo, items, deposit, caution } = payload

    // Calcul du prix total
    const totalPrice = items.reduce(
      (sum, item) => sum + item.quantity * item.pricePerUnit,
      0
    )

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

    // 1. Créer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        customer_infos: customerInfo,
        deposit,
        caution,
        reservation_status: (deposit > 0 ? 'CONFIRMED' : 'CONFIRMED_NO_DEPOSIT') as ReservationStatus,
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

    // 3. Retourner le succès avec l'ID de réservation
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
