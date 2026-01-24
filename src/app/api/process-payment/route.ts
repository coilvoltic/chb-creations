import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Match webhook API version
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requis' },
        { status: 400 }
      )
    }

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Le paiement n\'a pas été confirmé' },
        { status: 400 }
      )
    }

    // Récupérer l'ID de commande depuis client_reference_id
    const customerOrderId = session.client_reference_id

    if (!customerOrderId) {
      return NextResponse.json(
        { error: 'ID de commande manquant' },
        { status: 400 }
      )
    }

    // Récupérer la commande existante (créée par /api/create-checkout-session)
    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .select(`
        *,
        rental_reservations (id),
        purchase_reservations (id),
        prestation_reservations (id)
      `)
      .eq('id', parseInt(customerOrderId))
      .single()

    if (orderError || !customerOrder) {
      console.error('Erreur récupération commande:', orderError)
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    // La réservation a déjà été créée par /api/create-checkout-session
    // Le webhook s'occupera de mettre à jour le statut et d'envoyer l'email
    // Cette route sert juste à confirmer à l'utilisateur que tout est OK

    return NextResponse.json({
      success: true,
      orderId: customerOrder.id,
      reservationCode: customerOrder.order_number,
      rentalReservationId: customerOrder.rental_reservations?.[0]?.id || null,
      purchaseReservationId: customerOrder.purchase_reservations?.[0]?.id || null,
      prestationReservationId: customerOrder.prestation_reservations?.[0]?.id || null,
    })
  } catch (error) {
    console.error('Erreur traitement paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
