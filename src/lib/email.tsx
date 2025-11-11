import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { ReservationPDF } from './pdf-generator'
import React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ReservationItem {
  product_name: string
  quantity: number
  rental_start: string
  rental_end: string
  unit_price: number
  total_price: number
}

interface ReservationData {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  created_at: string
  items: ReservationItem[]
}

export async function sendReservationConfirmation(reservation: ReservationData) {
  try {
    // Générer le PDF
    const pdfBuffer = await renderToBuffer(<ReservationPDF reservation={reservation} />)

    // Convertir le buffer en base64 pour l'attachment
    const pdfBase64 = pdfBuffer.toString('base64')

    // Envoyer l'email avec le PDF en pièce jointe
    // TEMPORAIRE: En mode test, on envoie à volticthedev@gmail.com
    // TODO: Configurer un domaine sur Resend pour envoyer à n'importe quelle adresse
    const { data, error } = await resend.emails.send({
      from: 'CHB Créations <onboarding@resend.dev>',
      to: ['volticthedev@gmail.com'], // Mode test - À remplacer par reservation.customer_email après config domaine
      subject: `[TEST] Confirmation de votre réservation #${reservation.id}`,
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

              <p>Nous vous confirmons votre réservation pour vos articles de location.</p>

              <div class="reservation-number">
                Numéro de réservation: #${reservation.id}
              </div>

              <div class="info-section">
                <h2>Récapitulatif</h2>
                <p><strong>Nombre d'articles:</strong> ${reservation.items.length}</p>
                <p><strong>Montant total:</strong> ${reservation.total_amount.toFixed(2)} €</p>
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
          filename: `reservation-${reservation.id}.pdf`,
          content: pdfBase64,
        },
      ],
    })

    if (error) {
      console.error('Erreur envoi email:', error)
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`)
    }

    console.log('Email envoyé avec succès:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Exception lors de l\'envoi de l\'email:', error)
    throw error
  }
}
