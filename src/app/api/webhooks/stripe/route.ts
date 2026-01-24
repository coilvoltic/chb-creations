import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateReservationPDF } from '@/lib/pdf-generator'
import { generateReservationCode } from '@/lib/reservation-code'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  category: string
  quantity: number
  pricePerUnit: number
  rentalStart: string
  rentalEnd: string
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
  needsInstallation?: boolean
  installationFees?: number
  prestationDate?: string
  prestationTimeSlot?: string
}

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
    // Vérifier la signature du webhook
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

  // Gérer l'événement checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Paiement non confirmé' },
        { status: 400 }
      )
    }

    try {
      // Récupérer les données de réservation depuis les metadata
      const reservationData = JSON.parse(session.metadata?.reservationData || '{}')

      if (!reservationData.customerInfo || !reservationData.items) {
        throw new Error('Données de réservation invalides')
      }

      // 1. Créer la commande client (customer_order)
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
        throw new Error('Erreur lors de la création de la commande')
      }

      // 2. Séparer les items par type
      const rentalItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'locations')
      const purchaseItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'accessoires-personnalises')
      const prestationItems = (reservationData.items as CartItemPayload[]).filter((item: CartItemPayload) => item.category === 'henne')

      let rentalReservationId = null
      let purchaseReservationId = null
      let prestationReservationId = null

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
            total_price: rentalItems.reduce((sum: number, item: CartItemPayload) => sum + (item.pricePerUnit * item.quantity), 0),
            reservation_status: 'CONFIRMED',
          })
          .select()
          .single()

        if (reservationError || !rentalReservation) {
          console.error('Erreur création rental_reservation:', reservationError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création de la réservation location')
        }

        rentalReservationId = rentalReservation.id

        const rentalItemsToInsert = rentalItems.map((item: CartItemPayload) => ({
          rental_reservation_id: rentalReservation.id,
          product_id: item.productId,
          quantity: item.quantity,
          rental_start: item.rentalStart,
          rental_end: item.rentalEnd,
          options: item.selectedOptions ? { selectedOptions: item.selectedOptions, installationFees: item.installationFees } : null,
          personalizations: item.personalizations || null,
          needs_installation: item.needsInstallation || false,
        }))

        const { error: rentalItemsError } = await supabase
          .from('rental_items')
          .insert(rentalItemsToInsert)

        if (rentalItemsError) {
          console.error('Erreur création rental_items:', rentalItemsError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création des items de location')
        }
      }

      // 2b. Créer purchase_reservation si nécessaire
      if (purchaseItems.length > 0) {
        const { data: purchaseReservation, error: purchaseError } = await supabase
          .from('purchase_reservations')
          .insert({
            customer_order_id: customerOrder.id,
            delivery_address: reservationData.purchaseDelivery?.option !== 'pickup' ? reservationData.purchaseDelivery?.address : null,
            delivery_fees: reservationData.purchaseDelivery?.fees || 0,
            total_price: purchaseItems.reduce((sum: number, item: CartItemPayload) => sum + (item.pricePerUnit * item.quantity), 0),
            reservation_status: 'CONFIRMED',
          })
          .select()
          .single()

        if (purchaseError || !purchaseReservation) {
          console.error('Erreur création purchase_reservation:', purchaseError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création de la réservation achat')
        }

        purchaseReservationId = purchaseReservation.id

        const purchaseItemsToInsert = purchaseItems.map((item: CartItemPayload) => ({
          purchase_reservation_id: purchaseReservation.id,
          product_id: item.productId,
          quantity: item.quantity,
          estimated_delivery_date: null,
          options: item.selectedOptions ? { selectedOptions: item.selectedOptions, installationFees: item.installationFees } : null,
          personalizations: item.personalizations || null,
        }))

        const { error: purchaseItemsError } = await supabase
          .from('purchase_items')
          .insert(purchaseItemsToInsert)

        if (purchaseItemsError) {
          console.error('Erreur création purchase_items:', purchaseItemsError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création des items d\'achat')
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
            total_price: prestationItems.reduce((sum: number, item: CartItemPayload) => sum + (item.pricePerUnit * item.quantity), 0),
            reservation_status: 'CONFIRMED',
          })
          .select()
          .single()

        if (prestationError || !prestationReservation) {
          console.error('Erreur création prestation_reservation:', prestationError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création de la réservation prestation')
        }

        prestationReservationId = prestationReservation.id

        const prestationItemsToInsert = prestationItems.map((item: CartItemPayload) => ({
          prestation_reservation_id: prestationReservation.id,
          product_id: item.productId,
          quantity: item.quantity,
          prestation_date: item.prestationDate || null,
          time_slot: item.prestationTimeSlot || null,
          options: item.selectedOptions ? { selectedOptions: item.selectedOptions } : null,
          personalizations: item.personalizations || null,
        }))

        const { error: prestationItemsError } = await supabase
          .from('prestation_items')
          .insert(prestationItemsToInsert)

        if (prestationItemsError) {
          console.error('Erreur création prestation_items:', prestationItemsError)
          await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
          throw new Error('Erreur lors de la création des items de prestation')
        }
      }

      // 3. Générer le PDF de confirmation
      const rentalItemsForPdf = reservationData.items
        .filter((item: CartItemPayload) => item.category === 'locations')
        .map((item: CartItemPayload) => ({
          productName: item.productName,
          quantity: item.quantity,
          rentalStart: item.rentalStart,
          rentalEnd: item.rentalEnd,
          pricePerUnit: item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
          installationFees: item.installationFees,
          needsInstallation: item.needsInstallation,
        }))

      const purchaseItemsForPdf = reservationData.items
        .filter((item: CartItemPayload) => item.category === 'accessoires-personnalises')
        .map((item: CartItemPayload) => ({
          productName: item.productName,
          quantity: item.quantity,
          estimatedDeliveryDate: item.rentalStart,
          pricePerUnit: item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const prestationItemsForPdf = reservationData.items
        .filter((item: CartItemPayload) => item.category === 'henne')
        .map((item: CartItemPayload) => ({
          productName: item.productName,
          quantity: item.quantity,
          prestationDate: item.prestationDate,
          prestationTimeSlot: item.prestationTimeSlot,
          pricePerUnit: item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const pdfBuffer = await generateReservationPDF({
        reservationId: customerOrder.id,
        reservationCode: reservationCode,
        customerInfo: reservationData.customerInfo,
        rentalItems: rentalItemsForPdf.length > 0 ? rentalItemsForPdf : undefined,
        purchaseItems: purchaseItemsForPdf.length > 0 ? purchaseItemsForPdf : undefined,
        prestationItems: prestationItemsForPdf.length > 0 ? prestationItemsForPdf : undefined,
        totalPrice: reservationData.totalPrice,
        deposit: reservationData.deposit,
        caution: reservationData.caution,
        rentalDeliveryOption: reservationData.rentalDelivery?.option || 'pickup',
        rentalDeliveryAddress: reservationData.rentalDelivery?.address,
        rentalDeliveryFees: reservationData.rentalDelivery?.fees || 0,
        purchaseDeliveryOption: reservationData.purchaseDelivery?.option || 'pickup',
        purchaseDeliveryAddress: reservationData.purchaseDelivery?.address,
        purchaseDeliveryFees: reservationData.purchaseDelivery?.fees || 0,
        prestationDeliveryOption: reservationData.prestationDelivery?.option || 'pickup',
        prestationDeliveryAddress: reservationData.prestationDelivery?.address,
        prestationDeliveryFees: reservationData.prestationDelivery?.fees || 0,
      })

      // 4. Envoyer l'email de confirmation
      try {
        let deliveryText = 'récupération en boutique'
        if (reservationData.rentalDelivery?.option === 'delivery' ||
            reservationData.purchaseDelivery?.option !== 'pickup' ||
            reservationData.prestationDelivery?.option === 'delivery') {
          deliveryText = 'livraison'
        }

        await resend.emails.send({
          from: 'CHB Créations <noreply@chb-creations.fr>',
          to: reservationData.customerInfo.email,
          subject: `Confirmation de réservation ${reservationCode} - Paiement confirmé`,
          html: `
            <h1>Réservation confirmée !</h1>
            <p>Bonjour ${reservationData.customerInfo.firstName} ${reservationData.customerInfo.lastName},</p>
            <p>Votre réservation ${reservationCode} a été confirmée et votre paiement a été reçu avec succès.</p>
            <p><strong>Montant de l'acompte payé :</strong> ${reservationData.deposit.toFixed(2)} €</p>
            <p><strong>Solde restant :</strong> ${(reservationData.totalPrice - reservationData.deposit).toFixed(2)} €</p>
            <p>Le solde sera à régler lors de la ${deliveryText}.</p>
            <p>Vous trouverez tous les détails de votre réservation en pièce jointe.</p>
            <p>À très bientôt !</p>
            <p>L'équipe CHB Créations</p>
          `,
          attachments: [
            {
              filename: `reservation-${reservationCode}.pdf`,
              content: pdfBuffer,
            },
          ],
        })
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
        // Ne pas bloquer la réservation si l'email échoue
      }

      console.log(`Réservation ${reservationCode} créée avec succès via webhook`)

      return NextResponse.json({
        success: true,
        orderId: customerOrder.id,
        reservationCode: reservationCode,
        rentalReservationId,
        purchaseReservationId,
        prestationReservationId,
      })
    } catch (error) {
      console.error('Erreur traitement webhook:', error)
      return NextResponse.json(
        { error: 'Erreur lors du traitement du webhook' },
        { status: 500 }
      )
    }
  }

  // Retourner 200 pour les autres types d'événements
  return NextResponse.json({ received: true })
}
