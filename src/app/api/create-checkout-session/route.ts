import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const { amount, reservationData } = await request.json()

    if (!amount || !reservationData) {
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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover',
    })

    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Acompte pour réservation CHB Créations',
              description: `Acompte de ${amount.toFixed(2)} € pour votre réservation`,
            },
            unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/panier`,
      metadata: {
        reservationData: JSON.stringify(reservationData),
      },
      payment_intent_data: {
        metadata: {
          reservationData: JSON.stringify(reservationData),
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erreur création session Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
