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
        rental_reservations (
          id,
          delivery_address,
          delivery_fees,
          deposit,
          caution,
          rental_items (
            id,
            product_id,
            quantity,
            rental_start,
            rental_end,
            options,
            personalizations,
            needs_installation,
            products (name, price)
          )
        ),
        purchase_reservations (
          id,
          delivery_address,
          delivery_fees,
          purchase_items (
            product_id,
            quantity,
            estimated_delivery_date,
            options,
            personalizations,
            products (name, price)
          )
        ),
        prestation_reservations (
          id,
          delivery_address,
          delivery_fees,
          prestation_items (
            id,
            product_id,
            nb_of_people,
            prestation_start,
            prestation_end,
            options,
            personalizations,
            products (name, price)
          )
        )
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

    // Mettre à jour already_paid avec le montant payé en ligne
    const amountPaidOnline = session.amount_total ? session.amount_total / 100 : 0
    if (amountPaidOnline > 0) {
      const currentAlreadyPaid = customerOrder.already_paid ?? 0
      // Ne mettre à jour que si le webhook ne l'a pas déjà fait
      if (currentAlreadyPaid < amountPaidOnline) {
        await supabase
          .from('customer_orders')
          .update({ already_paid: amountPaidOnline })
          .eq('id', parseInt(customerOrderId))
        console.log('already_paid mis à jour à:', amountPaidOnline)
      }
    }

    // Mettre à jour les statuts des réservations à CONFIRMED si pas déjà fait par le webhook
    const updates = []
    if (customerOrder.rental_reservations) {
      for (const r of customerOrder.rental_reservations) {
        updates.push(supabase.from('rental_reservations').update({ reservation_status: 'CONFIRMED' }).eq('id', r.id))
      }
    }
    if (customerOrder.purchase_reservations) {
      for (const p of customerOrder.purchase_reservations) {
        updates.push(supabase.from('purchase_reservations').update({ reservation_status: 'CONFIRMED' }).eq('id', p.id))
      }
    }
    if (customerOrder.prestation_reservations) {
      for (const pr of customerOrder.prestation_reservations) {
        updates.push(supabase.from('prestation_reservations').update({ reservation_status: 'CONFIRMED' }).eq('id', pr.id))
      }
    }
    if (updates.length > 0) {
      await Promise.all(updates)
      console.log(`${updates.length} réservations confirmées via process-payment`)
    }

    // L'email de confirmation et la sync Google Calendar sont gérés par le webhook Stripe (/api/webhooks/stripe)
    // pour éviter les doublons. Ne pas envoyer d'email ici.

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
