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

    // Créer la réservation dans la base de données
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        customer_infos: reservationData.customerInfo,
        deposit: reservationData.deposit,
        caution: reservationData.caution,
        delivery_option: reservationData.deliveryOption,
        delivery_fees: reservationData.deliveryFees,
        total_price: reservationData.totalPrice,
        reservation_status: 'CONFIRMED', // Statut CONFIRMED car l'acompte a été payé
        stripe_payment_id: session.payment_intent as string,
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Erreur création réservation:', reservationError)
      throw new Error('Erreur lors de la création de la réservation')
    }

    // Créer les items de réservation
    const itemsToInsert = reservationData.items.map((item: ReservationItem) => ({
      reservation_id: reservation.id,
      product_id: item.productId,
      quantity: item.quantity,
      rental_start: item.rentalStart,
      rental_end: item.rentalEnd,
      options: item.selectedOption || null,
    }))

    const { error: itemsError } = await supabase
      .from('reservation_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Erreur création items:', itemsError)
      // Rollback: supprimer la réservation
      await supabase.from('reservations').delete().eq('id', reservation.id)
      throw new Error('Erreur lors de la création des items de réservation')
    }

    // Générer le PDF de confirmation
    const pdfBuffer = await generateReservationPDF({
      reservationId: reservation.id,
      customerInfo: reservationData.customerInfo,
      items: reservationData.items,
      totalPrice: reservationData.totalPrice,
      deposit: reservationData.deposit,
      caution: reservationData.caution,
      deliveryOption: reservationData.deliveryOption,
      deliveryFees: reservationData.deliveryFees,
    })

    // Envoyer l'email de confirmation
    try {
      await resend.emails.send({
        from: 'CHB Créations <noreply@chb-creations.fr>',
        to: reservationData.customerInfo.email,
        subject: `Confirmation de réservation #${reservation.id} - Paiement confirmé`,
        html: `
          <h1>Réservation confirmée !</h1>
          <p>Bonjour ${reservationData.customerInfo.firstName} ${reservationData.customerInfo.lastName},</p>
          <p>Votre réservation #${reservation.id} a été confirmée et votre paiement a été reçu avec succès.</p>
          <p><strong>Montant de l'acompte payé :</strong> ${reservationData.deposit.toFixed(2)} €</p>
          <p><strong>Solde restant :</strong> ${(reservationData.totalPrice - reservationData.deposit).toFixed(2)} €</p>
          <p>Le solde sera à régler lors de la ${reservationData.deliveryOption === 'delivery' ? 'livraison' : 'récupération en boutique'}.</p>
          <p>Vous trouverez tous les détails de votre réservation en pièce jointe.</p>
          <p>À très bientôt !</p>
          <p>L'équipe CHB Créations</p>
        `,
        attachments: [
          {
            filename: `reservation-${reservation.id}.pdf`,
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
      reservationId: reservation.id,
    })
  } catch (error) {
    console.error('Erreur traitement paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}
