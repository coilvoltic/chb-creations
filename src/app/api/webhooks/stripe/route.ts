import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generateReservationPDF } from '@/lib/pdf-generator'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error - Match webhook API version configured in Stripe Dashboard
  apiVersion: '2023-10-16',
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
          rental_reservations (*, rental_items (*, products (name))),
          purchase_reservations (*, purchase_items (*, products (name))),
          prestation_reservations (*, prestation_items (*, products (name)))
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

      // Préparer données PDF
      const rentalRes = customerOrder.rental_reservations?.[0]
      const purchaseRes = customerOrder.purchase_reservations?.[0]
      const prestationRes = customerOrder.prestation_reservations?.[0]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rentalItems = rentalRes?.rental_items?.map((item: any) => ({
        productName: item.products.name,
        quantity: item.quantity,
        rentalStart: item.rental_start,
        rentalEnd: item.rental_end,
        pricePerUnit: 0,
        selectedOptions: item.options?.selectedOptions as SelectedOption[] | undefined,
        personalizations: item.personalizations,
        installationFees: item.options?.installationFees,
        needsInstallation: item.needs_installation,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const purchaseItems = purchaseRes?.purchase_items?.map((item: any) => ({
        productName: item.products.name,
        quantity: item.quantity,
        estimatedDeliveryDate: item.estimated_delivery_date,
        pricePerUnit: 0,
        selectedOptions: item.options?.selectedOptions as SelectedOption[] | undefined,
        personalizations: item.personalizations,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prestationItems = prestationRes?.prestation_items?.map((item: any) => ({
        productName: item.products.name,
        quantity: item.quantity,
        prestationDate: item.prestation_date,
        prestationTimeSlot: item.time_slot,
        pricePerUnit: 0,
        selectedOptions: item.options?.selectedOptions as SelectedOption[] | undefined,
        personalizations: item.personalizations,
      }))

      // Générer PDF
      console.log('Generating PDF...')
      const pdfBuffer = await generateReservationPDF({
        reservationId: customerOrder.id,
        reservationCode: customerOrder.order_number,
        customerInfo: customerOrder.customer_infos,
        rentalItems,
        purchaseItems,
        prestationItems,
        totalPrice: customerOrder.total_price,
        deposit: rentalRes?.deposit || 0,
        caution: rentalRes?.caution || 0,
        rentalDeliveryOption: rentalRes?.delivery_address ? 'delivery' : 'pickup',
        rentalDeliveryAddress: rentalRes?.delivery_address,
        rentalDeliveryFees: rentalRes?.delivery_fees || 0,
        purchaseDeliveryOption: purchaseRes?.delivery_address ? 'delivery' : 'pickup',
        purchaseDeliveryAddress: purchaseRes?.delivery_address,
        purchaseDeliveryFees: purchaseRes?.delivery_fees || 0,
        prestationDeliveryOption: prestationRes?.delivery_address ? 'delivery' : 'pickup',
        prestationDeliveryAddress: prestationRes?.delivery_address,
        prestationDeliveryFees: prestationRes?.delivery_fees || 0,
      })
      console.log('PDF generated successfully')

      // Envoyer email
      const emailTo = process.env.RESEND_TEST_EMAIL || customerOrder.customer_infos.email
      console.log('Sending confirmation email to:', emailTo)
      console.log('Customer email:', customerOrder.customer_infos.email)
      try {
        const deposit = rentalRes?.deposit || 0

        // TEST: Envoyer d'abord SANS PDF pour voir si c'est le PDF le problème
        console.log('Attempting to send email WITHOUT PDF first...')
        const emailResult = await resend.emails.send({
          from: 'CHB Créations <noreply@chb-creations.fr>',
          to: emailTo,
          subject: `Confirmation de réservation ${customerOrder.order_number} - Paiement confirmé`,
          html: `
            <h1>Réservation confirmée !</h1>
            <p>Bonjour ${customerOrder.customer_infos.firstName} ${customerOrder.customer_infos.lastName},</p>
            <p>Votre réservation ${customerOrder.order_number} a été confirmée et votre paiement a été reçu avec succès.</p>
            <p><strong>Montant de l'acompte payé :</strong> ${deposit.toFixed(2)} €</p>
            <p><strong>Solde restant :</strong> ${(customerOrder.total_price - deposit).toFixed(2)} €</p>
            <p>Le solde sera à régler lors de la récupération ou livraison.</p>
            <p><strong>Note temporaire:</strong> Le PDF de confirmation sera envoyé séparément.</p>
            <p>À très bientôt !</p>
            <p>L'équipe CHB Créations</p>
          `,
          // Temporairement désactivé pour tester
          // attachments: [{ filename: `reservation-${customerOrder.order_number}.pdf`, content: pdfBuffer }],
        })
        console.log('Email sent successfully (without PDF):', emailResult.data?.id || 'No ID returned')

        if (emailResult.error) {
          console.error('Resend returned error:', emailResult.error)
        }
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
        console.error('Email error details:', emailError instanceof Error ? emailError.message : 'Unknown error')
        if (emailError instanceof Error && emailError.stack) {
          console.error('Stack trace:', emailError.stack)
        }
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
