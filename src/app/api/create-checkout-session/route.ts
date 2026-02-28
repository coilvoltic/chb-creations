import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { generateReservationCode } from '@/lib/reservation-code'
import { buildItemOptionsData } from '@/lib/reservation-utils'
import type { CartItemPayload } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { amount, reservationData } = await request.json()

    console.log('=== CREATE CHECKOUT SESSION ===')
    console.log('Amount:', amount)
    console.log('ReservationData:', JSON.stringify(reservationData, null, 2))

    if (!amount || !reservationData) {
      console.error('Missing amount or reservationData')
      return NextResponse.json(
        { error: 'Montant et données de réservation requis' },
        { status: 400 }
      )
    }

    // Vérifier que la clé Stripe est configurée
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY non configurée')
      return NextResponse.json(
        { error: 'Le paiement en ligne n\'est pas configuré. Veuillez choisir le paiement en espèces.' },
        { status: 500 }
      )
    }

    // 1. Créer la réservation avec statut PENDING
    const reservationCode = generateReservationCode()

    let promoCodeId: number | null = null
    if (reservationData.promoCode && reservationData.promoCode.code) {
      const { data: promoData } = await supabase
        .from('promotional_codes')
        .select('id')
        .eq('name', reservationData.promoCode.code.toUpperCase())
        .single()

      promoCodeId = promoData?.id || null
    }

    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: reservationData.customerInfo,
        total_price: reservationData.totalPrice,
        order_number: reservationCode,
        promotional_code_id: promoCodeId,
        promotional_code_name: reservationData.promoCode?.code || null,
        promotional_code_discount: reservationData.promoCode?.discount || null,
      })
      .select()
      .single()

    if (orderError || !customerOrder) {
      console.error('Erreur création customer_order:', orderError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande', details: orderError?.message },
        { status: 500 }
      )
    }

    console.log('✅ Customer order created:', customerOrder.id, 'Code:', reservationCode)

    // 2. Séparer les items par type
    const rentalItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'locations')
    const purchaseItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'accessoires-personnalises')
    const prestationItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'prestations')

    // 2a. Créer rental_reservation si nécessaire
    if (rentalItems.length > 0) {
      const { data: rentalReservation, error: reservationError } = await supabase
        .from('rental_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          deposit: reservationData.deposit,
          caution: reservationData.caution,
          delivery_address: reservationData.rentalDelivery?.option === 'delivery' ? reservationData.rentalDelivery.address : null,
          delivery_fees: reservationData.rentalDelivery?.fees || 0,
          total_price: rentalItems.reduce((sum: number, item: CartItemPayload) => {
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * item.quantity)
          }, 0),
          reservation_status: 'PENDING',
        })
        .select()
        .single()

      if (reservationError || !rentalReservation) {
        console.error('Erreur création rental_reservation:', reservationError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation location', details: reservationError?.message },
          { status: 500 }
        )
      }

      const rentalItemsToInsert = rentalItems.map((item: CartItemPayload) => ({
        rental_reservation_id: rentalReservation.id,
        product_id: item.productId,
        quantity: item.quantity,
        rental_start: item.rentalStart,
        rental_end: item.rentalEnd,
        options: buildItemOptionsData(item.selectedOptions, item.installationFees, item.pricePerUnit),
        personalizations: item.personalizations || null,
        needs_installation: item.needsInstallation || false,
      }))

      const { error: rentalItemsError } = await supabase
        .from('rental_items')
        .insert(rentalItemsToInsert)

      if (rentalItemsError) {
        console.error('Erreur création rental_items:', rentalItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des items de location', details: rentalItemsError.message },
          { status: 500 }
        )
      }
    }

    // 2b. Créer purchase_reservation si nécessaire
    if (purchaseItems.length > 0) {
      // Déterminer l'adresse de livraison selon le mode (identique à /api/reservations/create)
      let purchaseDeliveryAddress: string | null = null
      if (reservationData.purchaseDelivery?.option === 'delivery') {
        purchaseDeliveryAddress = reservationData.purchaseDelivery.address || null
      } else if (reservationData.purchaseDelivery?.option === 'relay_point' && reservationData.purchaseDelivery.relayPoint) {
        purchaseDeliveryAddress = `[Point Relais ${reservationData.purchaseDelivery.relayProvider === 'chronopost' ? 'Chronopost' : 'Mondial Relay'}] ${reservationData.purchaseDelivery.relayPoint.name} - ${reservationData.purchaseDelivery.relayPoint.address}`
      }

      const { data: purchaseReservation, error: purchaseError } = await supabase
        .from('purchase_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: purchaseDeliveryAddress,
          delivery_fees: reservationData.purchaseDelivery?.fees || 0,
          total_price: purchaseItems.reduce((sum: number, item: CartItemPayload) => {
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * item.quantity)
          }, 0),
          reservation_status: 'PENDING',
        })
        .select()
        .single()

      if (purchaseError || !purchaseReservation) {
        console.error('Erreur création purchase_reservation:', purchaseError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation achat', details: purchaseError?.message },
          { status: 500 }
        )
      }

      const purchaseItemsToInsert = purchaseItems.map((item: CartItemPayload) => ({
        purchase_reservation_id: purchaseReservation.id,
        product_id: item.productId,
        quantity: item.quantity,
        estimated_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        options: buildItemOptionsData(item.selectedOptions, item.installationFees, item.pricePerUnit),
        personalizations: item.personalizations || null,
      }))

      const { error: purchaseItemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItemsToInsert)

      if (purchaseItemsError) {
        console.error('Erreur création purchase_items:', purchaseItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des items d\'achat', details: purchaseItemsError.message },
          { status: 500 }
        )
      }
    }

    // 2c. Créer prestation_reservation si nécessaire
    if (prestationItems.length > 0) {
      const { data: prestationReservation, error: prestationError } = await supabase
        .from('prestation_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: reservationData.prestationDelivery?.option === 'delivery' ? reservationData.prestationDelivery.address : null,
          delivery_fees: reservationData.prestationDelivery?.fees || 0,
          total_price: prestationItems.reduce((sum: number, item: CartItemPayload) => {
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * (item.numberOfPeople || 1))
          }, 0),
          reservation_status: 'PENDING',
        })
        .select()
        .single()

      if (prestationError || !prestationReservation) {
        console.error('Erreur création prestation_reservation:', prestationError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation prestation', details: prestationError?.message },
          { status: 500 }
        )
      }

      const prestationItemsToInsert = prestationItems.map((item: CartItemPayload) => ({
        prestation_reservation_id: prestationReservation.id,
        product_id: item.productId,
        nb_of_people: item.numberOfPeople || 1,
        prestation_start: item.prestationStart || null,
        prestation_end: item.prestationEnd || null,
        options: buildItemOptionsData(item.selectedOptions, item.installationFees, item.pricePerUnit),
        personalizations: item.personalizations || null,
      }))

      const { error: prestationItemsError } = await supabase
        .from('prestation_items')
        .insert(prestationItemsToInsert)

      if (prestationItemsError) {
        console.error('Erreur création prestation_items:', prestationItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des items de prestation', details: prestationItemsError.message },
          { status: 500 }
        )
      }
    }

    // 3. Créer la session Stripe avec l'ID de commande
    const stripe = new Stripe(stripeSecretKey, {
      // @ts-expect-error - Match webhook API version
      apiVersion: '2023-10-16',
    })

    // Déterminer le type de paiement et le libellé
    const isFullPayment = reservationData.paymentMethod === 'full'
    const paymentLabel = isFullPayment ? 'Paiement intégral' : 'Acompte'
    const paymentDescription = isFullPayment
      ? `Paiement intégral de ${amount.toFixed(2)} € pour votre réservation CHB Créations`
      : `Acompte de ${amount.toFixed(2)} € pour votre réservation CHB Créations`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${paymentLabel} réservation ${reservationCode}`,
              description: paymentDescription,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier`,
      client_reference_id: customerOrder.id.toString(),
      metadata: {
        orderNumber: reservationCode,
        customerEmail: reservationData.customerInfo.email,
        paymentType: reservationData.paymentMethod || 'deposit',
      },
    })

    console.log('✅ Stripe session created:', session.id)
    console.log('✅ Redirecting to:', session.url)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erreur création session Stripe:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      raw: error
    })
    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la session de paiement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
