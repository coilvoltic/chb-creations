import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Pour l'instant, nous allons simplement logger les données
    // Dans un environnement de production, vous devriez intégrer un service d'email
    // comme SendGrid, Resend, Nodemailer avec SMTP, etc.

    console.log('Formulaire de contact reçu:', {
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    })

    // TODO: Intégrer un service d'envoi d'email
    // Exemple avec Resend ou SendGrid:
    // await sendEmail({
    //   to: 'chaymaeb.creations@gmail.com',
    //   from: 'noreply@chb-creations.com',
    //   subject: `Nouveau message de ${name} - ${subject}`,
    //   html: `
    //     <h2>Nouveau message de contact</h2>
    //     <p><strong>Nom:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Téléphone:</strong> ${phone || 'Non fourni'}</p>
    //     <p><strong>Sujet:</strong> ${subject}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message}</p>
    //   `
    // })

    return NextResponse.json(
      { message: 'Message envoyé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors du traitement du formulaire:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
