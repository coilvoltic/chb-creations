import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendReservationConfirmation } from '@/lib/email'
import { getSelectedOptionsFromDB, getInstallationFeesFromDB } from '@/lib/reservation-utils'
import { syncCalendarForOrder } from '@/lib/google-calendar'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Match webhook API version configured in Stripe Dashboard
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET non configurée')
      return NextResponse.json(
        { error: 'Configuration webhook manquante' },
        { status: 500 }
      )
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Erreur vérification webhook:', err)
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    console.log('=== WEBHOOK: checkout.session.completed ===')
    const session = event.data.object as Stripe.Checkout.Session
    console.log('Session ID:', session.id)
    console.log('Payment status:', session.payment_status)

    if (session.payment_status !== 'paid') {
      console.error('Payment not confirmed:', session.payment_status)
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 })
    }

    try {
      const customerOrderId = session.client_reference_id
      console.log('Customer Order ID:', customerOrderId)
      if (!customerOrderId) throw new Error('ID de commande manquant')

      // Récupérer la commande avec toutes ses réservations
      console.log('Fetching customer order...')
      const { data: customerOrder, error: orderError } = await supabase
        .from('customer_orders')
        .select(`
          *,
          rental_reservations (*, rental_items (*, google_event_id, google_event_id_return, products (name, price, new_price))),
          purchase_reservations (*, google_event_id, purchase_items (*, products (name, price, new_price))),
          prestation_reservations (*, prestation_items (*, google_event_id, products (name, price, new_price)))
        `)
        .eq('id', parseInt(customerOrderId))
        .single()

      if (orderError || !customerOrder) {
        console.error('Order fetch error:', orderError)
        throw new Error('Commande introuvable')
      }
      console.log('Order fetched successfully:', customerOrder.order_number)

      // Mettre à jour tous les statuts à CONFIRMED
      console.log('Updating reservation statuses to CONFIRMED...')
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
      await Promise.all(updates)
      console.log(`Updated ${updates.length} reservations to CONFIRMED`)

      // Sync Google Calendar
      try {
        await syncCalendarForOrder(customerOrder, supabase)
        console.log('✅ Google Calendar synchronisé via webhook')
      } catch (calendarError) {
        console.error('[Google Calendar] Erreur sync webhook (non bloquant):', calendarError)
      }

      // Incrémenter le montant déjà payé sur la commande
      const amountPaidOnline = session.amount_total ? session.amount_total / 100 : 0
      const currentAlreadyPaid = customerOrder.already_paid ?? 0
      await supabase
        .from('customer_orders')
        .update({ already_paid: currentAlreadyPaid + amountPaidOnline })
        .eq('id', parseInt(customerOrderId))
      console.log('Already paid updated to:', currentAlreadyPaid + amountPaidOnline)

      // Récupérer le type de paiement depuis les métadonnées de la session
      const paymentType = session.metadata?.paymentType || 'deposit'

      // Montant payé via Stripe
      const amountPaid = session.amount_total ? session.amount_total / 100 : 0

      // Préparer données pour l'email (même format que /api/reservations/create)
      const rentalRes = customerOrder.rental_reservations?.[0]
      const purchaseRes = customerOrder.purchase_reservations?.[0]
      const prestationRes = customerOrder.prestation_reservations?.[0]

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const rentalItems = (rentalRes?.rental_items || []).map((item: any) => {
        const selectedOptions = getSelectedOptionsFromDB(item.options)
        const installationFees = getInstallationFeesFromDB(item.options)
        const unitPrice = item.options?.unitPrice ?? item.products?.new_price ?? item.products?.price ?? 0
        const optionsFees = selectedOptions.reduce((sum: number, opt: any) => sum + opt.additional_fee, 0)
        const installFee = item.needs_installation ? installationFees : 0

        return {
          product_name: item.products?.name || 'Produit inconnu',
          quantity: item.quantity,
          rental_start: item.rental_start,
          rental_end: item.rental_end,
          unit_price: unitPrice,
          total_price: (unitPrice + optionsFees + installFee) * item.quantity,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
          personalizations: item.personalizations || undefined,
          installationFees: installationFees > 0 ? installationFees : undefined,
          needsInstallation: item.needs_installation || undefined,
        }
      })

      const purchaseItems = (purchaseRes?.purchase_items || []).map((item: any) => {
        const selectedOptions = getSelectedOptionsFromDB(item.options)
        const unitPrice = item.options?.unitPrice ?? item.products?.new_price ?? item.products?.price ?? 0
        const optionsFees = selectedOptions.reduce((sum: number, opt: any) => sum + opt.additional_fee, 0)

        return {
          product_name: item.products?.name || 'Produit inconnu',
          quantity: item.quantity,
          estimated_delivery_date: item.estimated_delivery_date || undefined,
          unit_price: unitPrice,
          total_price: (unitPrice + optionsFees) * item.quantity,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
          personalizations: item.personalizations || undefined,
        }
      })

      const prestationItems = (prestationRes?.prestation_items || []).map((item: any) => {
        const selectedOptions = getSelectedOptionsFromDB(item.options)
        const unitPrice = item.options?.unitPrice ?? item.products?.new_price ?? item.products?.price ?? 0

        return {
          product_name: item.products?.name || 'Produit inconnu',
          nb_of_people: item.nb_of_people || 1,
          prestation_start: item.prestation_start || undefined,
          prestation_end: item.prestation_end || undefined,
          unit_price: unitPrice,
          total_price: unitPrice,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
          personalizations: item.personalizations || undefined,
        }
      })
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Envoyer l'email de confirmation (même template que lors de la création)
      try {
        await sendReservationConfirmation({
          id: customerOrder.id,
          reservation_code: String(customerOrder.order_number),
          customer_name: `${customerOrder.customer_infos.firstName} ${customerOrder.customer_infos.lastName}`,
          customer_email: customerOrder.customer_infos.email,
          customer_phone: customerOrder.customer_infos.phone,
          total_amount: customerOrder.total_price,
          created_at: customerOrder.created_at,
          rentalItems: rentalItems.length > 0 ? rentalItems : undefined,
          purchaseItems: purchaseItems.length > 0 ? purchaseItems : undefined,
          prestationItems: prestationItems.length > 0 ? prestationItems : undefined,
          rentalDeliveryAddress: rentalRes?.delivery_address || null,
          rentalDeliveryFees: rentalRes?.delivery_fees || 0,
          purchaseDeliveryAddress: purchaseRes?.delivery_address || null,
          purchaseDeliveryFees: purchaseRes?.delivery_fees || 0,
          prestationDeliveryAddress: prestationRes?.delivery_address || null,
          prestationDeliveryFees: prestationRes?.delivery_fees || 0,
          deposit: rentalRes?.deposit || 0,
          caution: rentalRes?.caution || 0,
          paymentType: paymentType as 'cash' | 'deposit' | 'full',
          amountPaid: currentAlreadyPaid + amountPaid,
          promoCode: customerOrder.promotional_code_name || null,
          promoDiscount: customerOrder.promotional_code_discount || null,
        })
        console.log('✅ Email de confirmation envoyé via webhook')
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
      }

      console.log(`Réservation ${customerOrder.order_number} confirmée via webhook`)
      return NextResponse.json({ success: true, orderId: customerOrder.id, reservationCode: customerOrder.order_number })
    } catch (error) {
      console.error('Erreur traitement webhook:', error)
      return NextResponse.json({ error: 'Erreur lors du traitement du webhook' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
