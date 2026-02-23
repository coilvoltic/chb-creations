import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReservationPDF } from './pdf-generator'
import React from 'react'
import fs from 'fs'
import path from 'path'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface RentalItem {
  product_name: string
  quantity: number
  rental_start: string
  rental_end: string
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
  installationFees?: number
  needsInstallation?: boolean
}

interface PurchaseItem {
  product_name: string
  quantity: number
  estimated_delivery_date?: string
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
}

interface PrestationItem {
  product_name: string
  nb_of_people: number // Number of people for the prestation
  prestation_start?: string // ISO timestamp (date + heure de début)
  prestation_end?: string // ISO timestamp (date + heure de fin)
  unit_price: number
  total_price: number
  selectedOptions?: SelectedOption[]
  personalizations?: { [key: string]: string }
}

interface ReservationData {
  id: number
  reservation_code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  created_at: string
  rentalItems?: RentalItem[]
  purchaseItems?: PurchaseItem[]
  prestationItems?: PrestationItem[]
  rentalDeliveryAddress?: string | null
  purchaseDeliveryAddress?: string | null
  prestationDeliveryAddress?: string | null
  rentalDeliveryFees?: number
  purchaseDeliveryFees?: number
  prestationDeliveryFees?: number
  deposit: number
  caution: number
  paymentType?: 'cash' | 'deposit' | 'full'
  amountPaid?: number
  promoCode?: string | null
  promoDiscount?: number | null
}

export async function sendReservationConfirmation(reservation: ReservationData) {
  try {
    console.log('📧 sendReservationConfirmation - START')
    console.log('To:', reservation.customer_email)
    console.log('Reservation code:', reservation.reservation_code)

    // Générer le PDF
    console.log('Generating PDF...')
    const pdfBuffer = await renderToBuffer(<ReservationPDF reservation={reservation} />)
    console.log('PDF generated, size:', pdfBuffer.length, 'bytes')

    // Convertir le buffer en base64 pour l'attachment
    const pdfBase64 = pdfBuffer.toString('base64')
    console.log('PDF base64 length:', pdfBase64.length)

    // Lire le fichier CGU.pdf
    const cguPath = path.join(process.cwd(), 'public', 'docs', 'CGU.pdf')
    const cguBase64 = fs.readFileSync(cguPath).toString('base64')

    // Envoyer l'email avec le PDF en pièce jointe
    console.log('Sending email via Resend...')
    const { data, error } = await resend.emails.send({
      from: 'CHB Créations <noreply@chb-creations.com>',
      to: [reservation.customer_email],
      /*bcc: ['chaymaeb.creations@gmail.com', 'volticthedev@gmail.com'],*/
      subject: `Confirmation de votre réservation n° ${reservation.reservation_code}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #000;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                margin: 20px 0;
              }
              .reservation-number {
                background-color: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
              }
              .info-section {
                margin: 20px 0;
              }
              .info-section h2 {
                font-size: 18px;
                margin-bottom: 10px;
                color: #000;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
                text-align: center;
                font-size: 14px;
                color: #666;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #000;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CHB Créations</h1>
              <p>Confirmation de réservation</p>
            </div>

            <div class="content">
              <p>Bonjour ${reservation.customer_name},</p>

              <p>Nous vous confirmons votre réservation${reservation.rentalItems?.length ? ' de location' : ''}${reservation.purchaseItems?.length ? (reservation.rentalItems?.length ? ', ' : ' d\'') + 'accessoires personnalisés' : ''}${reservation.prestationItems?.length ? ((reservation.rentalItems?.length || reservation.purchaseItems?.length) ? ' et ' : ' de ') + 'prestation henné' : ''}.</p>

              <div class="reservation-number">
                Numéro de réservation: ${reservation.reservation_code}
              </div>

              <div class="info-section">
                <h2>Récapitulatif</h2>
                <p><strong>Nombre d'articles:</strong> ${(reservation.rentalItems?.length || 0) + (reservation.purchaseItems?.length || 0) + (reservation.prestationItems?.length || 0)}</p>
                ${reservation.promoCode && reservation.promoDiscount ? `
                  <p style="color: #16a34a;"><strong>Code promo appliqué:</strong> ${reservation.promoCode} (-${reservation.promoDiscount}%)</p>
                ` : ''}
                <p><strong>Montant total:</strong> ${reservation.total_amount.toFixed(2)} €</p>
                ${reservation.paymentType === 'full' && reservation.amountPaid ? `
                  <p style="color: #16a34a;"><strong>✓ Paiement intégral effectué:</strong> ${reservation.amountPaid.toFixed(2)} €</p>
                ` : ''}
                ${reservation.paymentType === 'deposit' && reservation.deposit > 0 ? `
                  <p><strong>Acompte versé:</strong> ${reservation.deposit.toFixed(2)} €</p>
                  <p><strong>Solde restant à régler:</strong> ${(reservation.total_amount - reservation.deposit).toFixed(2)} €</p>
                  <p style="font-size: 13px; color: #666;">Le solde sera à régler avant la prestation.</p>
                ` : ''}
                ${reservation.paymentType === 'cash' && reservation.deposit > 0 ? `
                  <p><strong>Acompte à verser en boutique:</strong> ${reservation.deposit.toFixed(2)} €</p>
                  <p style="font-size: 13px; color: #666;">L'acompte est à payer en boutique pour valider la commande.</p>
                ` : ''}
                ${reservation.caution > 0 ? `
                  <p style="color: #d97706;"><strong>⚠️ Caution:</strong> ${reservation.caution.toFixed(2)} € (non encaissée sauf dommage)</p>
                ` : ''}
              </div>

              <div class="info-section">
                <h2>Pièce jointe</h2>
                <p>Vous trouverez ci-joint votre confirmation de réservation au format PDF avec tous les détails de votre commande.</p>
              </div>

              <div class="info-section">
                <h2>Informations importantes</h2>
                <ul>
                  <li>Les articles doivent être récupérés à la date convenue</li>
                  <li>Une caution pourra être demandée lors de la récupération</li>
                  <li>Les articles doivent être retournés dans l'état dans lequel ils ont été loués</li>
                </ul>
              </div>

              <p>Pour toute question concernant votre réservation, n'hésitez pas à nous contacter.</p>

              <p>À très bientôt,<br><strong>L'équipe CHB Créations</strong></p>
            </div>

            <div class="footer">
              <p>CHB Créations - Marseille</p>
              <p>Email: chaymaeb.creations@gmail.com</p>
              <p style="margin-top: 10px; font-size: 12px;">
                Merci de votre confiance !
              </p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `reservation-${reservation.reservation_code}.pdf`,
          content: pdfBase64,
        },
        {
          filename: 'CGU-CHB-Creations.pdf',
          content: cguBase64,
        },
      ],
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`)
    }

    console.log('✅ Email envoyé avec succès via Resend!')
    console.log('Email ID:', data?.id)
    console.log('Response data:', JSON.stringify(data, null, 2))
    return { success: true, data }
  } catch (error) {
    console.error('❌ Exception lors de l\'envoi de l\'email:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

export async function sendDatesUpdateNotification(reservation: ReservationData) {
  try {
    console.log('📧 sendDatesUpdateNotification - START')
    console.log('To:', reservation.customer_email)
    console.log('Reservation code:', reservation.reservation_code)

    // Générer le PDF mis à jour
    console.log('Generating updated PDF...')
    const pdfBuffer = await renderToBuffer(<ReservationPDF reservation={reservation} />)
    const pdfBase64 = pdfBuffer.toString('base64')

    console.log('Sending dates update notification email via Resend...')
    const { data, error } = await resend.emails.send({
      from: 'CHB Créations <noreply@chb-creations.com>',
      to: [reservation.customer_email],
      bcc: ['chaymaeb.creations@gmail.com', 'volticthedev@gmail.com'],
      subject: `Modification de dates - Réservation n° ${reservation.reservation_code}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #000;
                margin-bottom: 30px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                margin: 20px 0;
              }
              .reservation-number {
                background-color: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
                text-align: center;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CHB Créations</h1>
              <p>Modification de réservation</p>
            </div>

            <div class="content">
              <p>Bonjour ${reservation.customer_name},</p>

              <p>Les dates de votre réservation ont été modifiées.</p>

              <div class="reservation-number">
                Réservation n° ${reservation.reservation_code}
              </div>

              <p>Vous trouverez ci-joint votre confirmation de réservation mise à jour avec les nouvelles dates.</p>

              <p>Pour toute question, n'hésitez pas à nous contacter.</p>

              <p>À très bientôt,<br><strong>L'équipe CHB Créations</strong></p>
            </div>

            <div class="footer">
              <p>CHB Créations - Marseille</p>
              <p>Email: chaymaeb.creations@gmail.com</p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `reservation-${reservation.reservation_code}.pdf`,
          content: pdfBase64,
        },
      ],
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`)
    }

    console.log('✅ Email de modification de dates envoyé avec succès!')
    console.log('Email ID:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Exception lors de l\'envoi de l\'email de modification:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}
