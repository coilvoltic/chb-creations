import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateReservationPDF } from '@/lib/pdf-generator'
import { generateReservationCode } from '@/lib/reservation-code'

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  category: string // 'locations' or 'accessoires-personnalises'
  quantity: number
  pricePerUnit: number
  rentalStart: string
  rentalEnd: string
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
  needsInstallation?: boolean
  installationFees?: number
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

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

    // Récupérer les données de réservation depuis les metadata
    const reservationData = JSON.parse(session.metadata?.reservationData || '{}')

    if (!reservationData.customerInfo || !reservationData.items) {
      return NextResponse.json(
        { error: 'Données de réservation invalides' },
        { status: 400 }
      )
    }

    // 1. Créer la commande client (customer_order)
    const reservationCode = generateReservationCode()

    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: reservationData.customerInfo,
        total_price: reservationData.totalPrice,
        order_number: reservationCode,
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

    let rentalReservationId = null
    let purchaseReservationId = null

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
          reservation_status: 'CONFIRMED', // Statut CONFIRMED car l'acompte a été payé
        })
        .select()
        .single()

      if (reservationError || !rentalReservation) {
        console.error('Erreur création rental_reservation:', reservationError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        throw new Error('Erreur lors de la création de la réservation location')
      }

      rentalReservationId = rentalReservation.id

      // Créer les rental_items
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

      // Créer les purchase_items
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

    // 3. Générer le PDF de confirmation
    // Séparer les items en locations et achats pour le PDF
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
      }))

    const purchaseItemsForPdf = reservationData.items
      .filter((item: CartItemPayload) => item.category === 'accessoires-personnalises')
      .map((item: CartItemPayload) => ({
        productName: item.productName,
        quantity: item.quantity,
        estimatedDeliveryDate: item.rentalStart, // Utiliser rentalStart comme date estimée pour les achats
        pricePerUnit: item.pricePerUnit,
        selectedOptions: item.selectedOptions,
        personalizations: item.personalizations,
      }))

    const pdfBuffer = await generateReservationPDF({
      reservationId: customerOrder.id, // Utiliser l'ID de la commande principale
      reservationCode: reservationCode,
      customerInfo: reservationData.customerInfo,
      rentalItems: rentalItemsForPdf.length > 0 ? rentalItemsForPdf : undefined,
      purchaseItems: purchaseItemsForPdf.length > 0 ? purchaseItemsForPdf : undefined,
      totalPrice: reservationData.totalPrice,
      deposit: reservationData.deposit,
      caution: reservationData.caution,
      rentalDeliveryOption: reservationData.rentalDelivery?.option || 'pickup',
      rentalDeliveryAddress: reservationData.rentalDelivery?.address,
      rentalDeliveryFees: reservationData.rentalDelivery?.fees || 0,
      purchaseDeliveryOption: reservationData.purchaseDelivery?.option || 'pickup',
      purchaseDeliveryAddress: reservationData.purchaseDelivery?.address,
      purchaseDeliveryFees: reservationData.purchaseDelivery?.fees || 0,
    })

    // 4. Envoyer l'email de confirmation
    try {
      // Construire le texte de livraison
      let deliveryText = 'récupération en boutique'
      if (reservationData.rentalDelivery?.option === 'delivery' || reservationData.purchaseDelivery?.option !== 'pickup') {
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

    return NextResponse.json({
      success: true,
      orderId: customerOrder.id,
      reservationCode: reservationCode,
      rentalReservationId: rentalReservationId,
      purchaseReservationId: purchaseReservationId,
    })
  } catch (error) {
    console.error('Erreur traitement paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
