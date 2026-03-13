import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createRentalEvents, createPurchaseEvent, createPrestationEvent } from '@/lib/google-calendar'

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

    // Sync Google Calendar - créer les événements à la confirmation Stripe
    try {
      const customerName = `${customerOrder.customer_infos.firstName} ${customerOrder.customer_infos.lastName}`
      const customerPhone = customerOrder.customer_infos.phone
      const orderNumber = String(customerOrder.order_number)

      for (const r of customerOrder.rental_reservations || []) {
        const items = r.rental_items || []
        if (!items.length) continue
        const starts = items.map((i: { rental_start: string }) => new Date(i.rental_start).getTime())
        const ends = items.map((i: { rental_end: string }) => new Date(i.rental_end).getTime())
        const { pickupEventId, returnEventId } = await createRentalEvents({
          orderNumber,
          customerName,
          customerPhone,
          productNames: items.map((i: { products: { name: string } }) => i.products.name),
          rentalStart: new Date(Math.min(...starts)).toISOString(),
          rentalEnd: new Date(Math.max(...ends)).toISOString(),
          deliveryAddress: r.delivery_address || null,
        })
        if (pickupEventId || returnEventId) {
          await supabase.from('rental_reservations')
            .update({ google_event_id: pickupEventId, google_event_id_return: returnEventId })
            .eq('id', r.id)
        }
      }

      for (const p of customerOrder.purchase_reservations || []) {
        const items = p.purchase_items || []
        if (!items.length) continue
        const estimatedDate = items[0]?.estimated_delivery_date
          || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const eventId = await createPurchaseEvent({
          orderNumber,
          customerName,
          customerPhone,
          productNames: items.map((i: { products: { name: string } }) => i.products.name),
          estimatedDeliveryDate: estimatedDate,
          deliveryAddress: p.delivery_address || null,
        })
        if (eventId) {
          await supabase.from('purchase_reservations').update({ google_event_id: eventId }).eq('id', p.id)
        }
      }

      for (const pr of customerOrder.prestation_reservations || []) {
        const items = pr.prestation_items || []
        const firstItem = items.find((i: { prestation_start?: string; prestation_end?: string }) => i.prestation_start && i.prestation_end)
        if (!firstItem) continue
        const eventId = await createPrestationEvent({
          orderNumber,
          customerName,
          customerPhone,
          serviceName: items.map((i: { products: { name: string } }) => i.products.name).join(', '),
          nbOfPeople: items.reduce((sum: number, i: { nb_of_people?: number }) => sum + (i.nb_of_people || 1), 0),
          prestationStart: firstItem.prestation_start!,
          prestationEnd: firstItem.prestation_end!,
          deliveryAddress: pr.delivery_address || null,
        })
        if (eventId) {
          await supabase.from('prestation_reservations').update({ google_event_id: eventId }).eq('id', pr.id)
        }
      }
    } catch (calendarError) {
      console.error('[Google Calendar] Erreur création événements Stripe (non bloquant):', calendarError)
    }

    // L'email de confirmation est envoyé par le webhook Stripe (/api/webhooks/stripe)
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
