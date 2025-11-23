import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateReservationPDF } from '@/lib/pdf-generator'

interface SelectedOption {
  name: string
  description: string
  additional_fee: number
}

interface ReservationItem {
  productId: number
  productName: string
  quantity: number
  pricePerUnit: number
  rentalStart: string
  rentalEnd: string
  selectedOption?: SelectedOption
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
    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: reservationData.customerInfo,
        total_price: reservationData.totalPrice,
        order_number: Date.now(), // Génération simple d'un numéro de commande
      })
      .select()
      .single()

    if (orderError || !customerOrder) {
      console.error('Erreur création customer_order:', orderError)
      throw new Error('Erreur lors de la création de la commande')
    }

    // 2. Créer la rental_reservation (liée à customer_order)
    const { data: rentalReservation, error: reservationError } = await supabase
      .from('rental_reservations')
      .insert({
        customer_order_id: customerOrder.id,
        deposit: reservationData.deposit,
        caution: reservationData.caution,
        delivery_address: reservationData.deliveryOption === 'delivery' ? reservationData.deliveryAddress : null,
        delivery_fees: reservationData.deliveryFees,
        total_price: reservationData.totalPrice,
        reservation_status: 'CONFIRMED', // Statut CONFIRMED car l'acompte a été payé
      })
      .select()
      .single()

    if (reservationError || !rentalReservation) {
      console.error('Erreur création rental_reservation:', reservationError)
      // Rollback: supprimer la commande créée (cascade supprimera aussi)
      await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
      throw new Error('Erreur lors de la création de la réservation')
    }

    // 3. Créer les rental_items
    const itemsToInsert = reservationData.items.map((item: ReservationItem) => ({
      rental_reservation_id: rentalReservation.id,
      product_id: item.productId,
      quantity: item.quantity,
      rental_start: item.rentalStart,
      rental_end: item.rentalEnd,
      options: item.selectedOption || null,
    }))

    const { error: itemsError } = await supabase
      .from('rental_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Erreur création rental_items:', itemsError)
      // Rollback: supprimer la commande (cascade supprimera rental_reservation et rental_items)
      await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
      throw new Error('Erreur lors de la création des items de réservation')
    }

    // 4. Générer le PDF de confirmation
    const pdfBuffer = await generateReservationPDF({
      reservationId: rentalReservation.id,
      orderNumber: customerOrder.order_number,
      customerInfo: reservationData.customerInfo,
      items: reservationData.items,
      totalPrice: reservationData.totalPrice,
      deposit: reservationData.deposit,
      caution: reservationData.caution,
      deliveryOption: reservationData.deliveryOption,
      deliveryFees: reservationData.deliveryFees,
    })

    // 5. Envoyer l'email de confirmation
    try {
      await resend.emails.send({
        from: 'CHB Créations <noreply@chb-creations.fr>',
        to: reservationData.customerInfo.email,
        subject: `Confirmation de commande #${customerOrder.order_number} - Paiement confirmé`,
        html: `
          <h1>Réservation confirmée !</h1>
          <p>Bonjour ${reservationData.customerInfo.firstName} ${reservationData.customerInfo.lastName},</p>
          <p>Votre commande #${customerOrder.order_number} a été confirmée et votre paiement a été reçu avec succès.</p>
          <p><strong>Montant de l'acompte payé :</strong> ${reservationData.deposit.toFixed(2)} €</p>
          <p><strong>Solde restant :</strong> ${(reservationData.totalPrice - reservationData.deposit).toFixed(2)} €</p>
          <p>Le solde sera à régler lors de la ${reservationData.deliveryOption === 'delivery' ? 'livraison' : 'récupération en boutique'}.</p>
          <p>Vous trouverez tous les détails de votre réservation en pièce jointe.</p>
          <p>À très bientôt !</p>
          <p>L'équipe CHB Créations</p>
        `,
        attachments: [
          {
            filename: `commande-${customerOrder.order_number}.pdf`,
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
      orderNumber: customerOrder.order_number,
      reservationId: rentalReservation.id,
    })
  } catch (error) {
    console.error('Erreur traitement paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
