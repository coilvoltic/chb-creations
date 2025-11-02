'use client'

import Navbar from '@/components/Navbar'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-stone-100 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Contact
            </h1>
            <p className="text-xl text-stone-600">
              Une question ? Un projet ? N&apos;hésitez pas à nous contacter
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white border border-stone-200 rounded-sm p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-6">
                Envoyez-nous un message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-stone-300 rounded-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-stone-300 rounded-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-stone-300 rounded-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-stone-700 mb-2">
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-stone-300 rounded-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="locations">Location</option>
                    <option value="accessoires">Accessoires personnalisés</option>
                    <option value="henne">Prestation henné</option>
                    <option value="decoration">Livraison / Installation décoration</option>
                    <option value="autre">Autre demande</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-stone-300 rounded-sm focus:ring-1 focus:ring-stone-500 focus:border-stone-500"
                  />
                </div>

                {/* Submit Status Messages */}
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-sm">
                    Merci ! Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-sm">
                    Une erreur s&apos;est produite. Veuillez réessayer ou nous contacter directement.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white px-6 py-3 font-semibold hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white border border-stone-200 rounded-sm p-8">
                <h2 className="text-2xl font-bold text-stone-900 mb-6">
                  Informations de contact
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-stone-600 mt-1 mr-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-stone-900">Email</h3>
                      <a href="mailto:chaymaeb.creations@gmail.com" className="text-stone-600 hover:text-stone-800">
                        chaymaeb.creations@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-stone-600 mt-1 mr-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-stone-900">Téléphone</h3>
                      <div className="text-stone-600">
                        <div>+33 6 67 94 26 90 - Chaymae</div>
                        <div>+33 9 83 72 755 - Boutique</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-stone-600 mt-1 mr-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-stone-900">Adresse</h3>
                      <p className="text-stone-600">
                        100 Boulevard de Saint-Loup<br />
                        13010 Marseille, France
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-sm p-8 text-stone-50">
                <h2 className="text-2xl font-bold mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Lundi au Vendredi</span>
                    <span className="font-semibold">14h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi & Dimanche</span>
                    <span className="font-semibold">Fermé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
