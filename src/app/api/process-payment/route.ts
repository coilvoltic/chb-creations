import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendReservationConfirmation } from '@/lib/email'

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

    // Envoyer l'email de confirmation avec les données de la commande
    try {
      const customerInfo = customerOrder.customer_infos as { firstName: string; lastName: string; email: string; phone: string }

      // Construire les items pour l'email à partir des données en base
      const rentalReservation = customerOrder.rental_reservations?.[0]
      const purchaseReservation = customerOrder.purchase_reservations?.[0]
      // Pour les prestations, il peut y en avoir plusieurs (cas mix boutique+domicile)
      const prestationReservations = customerOrder.prestation_reservations || []

      type StoredItemOptions = {
        selectedOptions?: { option_type_name: string; name: string; additional_fee: number }[]
        installationFees?: number
        unitPrice?: number
      }

      const rentalItemsForEmail = rentalReservation?.rental_items?.map((item: {
        quantity: number; rental_start: string; rental_end: string;
        options: StoredItemOptions | null;
        personalizations: Record<string, string> | null;
        needs_installation: boolean;
        products: { name: string; price: number }
      }) => {
        const selectedOptions = item.options?.selectedOptions || []
        const installFee = (item.needs_installation && item.options?.installationFees) ? item.options.installationFees : 0
        // Utiliser unitPrice stocké (prix promo inclus), sinon fallback sur products.price + options
        const unitPrice = item.options?.unitPrice
          ?? (item.products.price + selectedOptions.reduce((s, o) => s + o.additional_fee, 0))
        return {
          product_name: item.products.name,
          quantity: item.quantity,
          rental_start: item.rental_start,
          rental_end: item.rental_end,
          unit_price: unitPrice,
          total_price: item.quantity * (unitPrice + installFee),
          selectedOptions,
          personalizations: item.personalizations || undefined,
          installationFees: item.options?.installationFees,
          needsInstallation: item.needs_installation,
        }
      }) || undefined

      const purchaseItemsForEmail = purchaseReservation?.purchase_items?.map((item: {
        quantity: number; estimated_delivery_date: string | null;
        options: StoredItemOptions | null;
        personalizations: Record<string, string> | null;
        products: { name: string; price: number }
      }) => {
        const selectedOptions = item.options?.selectedOptions || []
        const unitPrice = item.options?.unitPrice
          ?? (item.products.price + selectedOptions.reduce((s, o) => s + o.additional_fee, 0))
        return {
          product_name: item.products.name,
          quantity: item.quantity,
          estimated_delivery_date: item.estimated_delivery_date || undefined,
          unit_price: unitPrice,
          total_price: item.quantity * unitPrice,
          selectedOptions,
          personalizations: item.personalizations || undefined,
        }
      }) || undefined

      const prestationItemsForEmail = prestationReservations.flatMap((res: {
        prestation_items: Array<{
          nb_of_people: number; prestation_start: string | null; prestation_end: string | null;
          options: StoredItemOptions | null;
          personalizations: Record<string, string> | null;
          products: { name: string; price: number }
        }>
      }) => res.prestation_items?.map((item) => {
        const selectedOptions = item.options?.selectedOptions || []
        const unitPrice = item.options?.unitPrice
          ?? (item.products.price + selectedOptions.reduce((s, o) => s + o.additional_fee, 0))
        return {
          product_name: item.products.name,
          nb_of_people: item.nb_of_people,
          prestation_start: item.prestation_start || undefined,
          prestation_end: item.prestation_end || undefined,
          unit_price: unitPrice,
          total_price: item.nb_of_people * unitPrice,
          selectedOptions,
          personalizations: item.personalizations || undefined,
        }
      }) || [])

      // Adresse de livraison achat (peut contenir l'adresse point relais formatée)
      const purchaseDeliveryAddress = purchaseReservation?.delivery_address || null

      // Pour les prestations mix : première réservation = boutique (pas d'adresse), deuxième = domicile
      const hasMixedPrestations = prestationReservations.length > 1
      const prestationDomicileReservation = hasMixedPrestations
        ? prestationReservations.find((r: { delivery_address: string | null }) => r.delivery_address !== null)
        : null
      const prestationHomogeneReservation = !hasMixedPrestations ? prestationReservations[0] : null

      const emailData = {
        id: customerOrder.id,
        reservation_code: customerOrder.order_number,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: customerOrder.total_price,
        created_at: customerOrder.created_at,
        rentalItems: rentalItemsForEmail,
        purchaseItems: purchaseItemsForEmail,
        prestationItems: prestationItemsForEmail.length > 0 ? prestationItemsForEmail : undefined,
        rentalDeliveryAddress: rentalReservation?.delivery_address || null,
        rentalDeliveryFees: rentalReservation?.delivery_fees || 0,
        purchaseDeliveryAddress,
        purchaseDeliveryFees: purchaseReservation?.delivery_fees || 0,
        prestationDeliveryAddress: hasMixedPrestations ? null : (prestationHomogeneReservation?.delivery_address || null),
        prestationDeliveryFees: hasMixedPrestations ? 0 : (prestationHomogeneReservation?.delivery_fees || 0),
        prestationDomicileDeliveryAddress: prestationDomicileReservation?.delivery_address || null,
        prestationDomicileDeliveryFees: prestationDomicileReservation?.delivery_fees || 0,
        deposit: rentalReservation?.deposit || 0,
        caution: rentalReservation?.caution || 0,
        amountPaid: amountPaidOnline,
      }

      await sendReservationConfirmation(emailData)
      console.log('✅ Email de confirmation envoyé après paiement Stripe')
    } catch (emailError) {
      // Ne pas faire échouer le process-payment si l'email échoue
      console.error('❌ Erreur envoi email (paiement confirmé):', emailError)
    }

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
