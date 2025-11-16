'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<number | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setError('Session de paiement invalide')
      setIsProcessing(false)
      return
    }

    const processPayment = async () => {
      try {
        const response = await fetch('/api/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du traitement du paiement')
        }

        setReservationId(data.reservationId)
        setIsProcessing(false)

        // Vider le panier du localStorage
        localStorage.removeItem('chb-cart')
      } catch (err) {
        console.error('Erreur traitement paiement:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors du traitement du paiement')
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 border-4 border-stone-200 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-4">Traitement de votre paiement...</h1>
            <p className="text-stone-600">Veuillez patienter pendant que nous confirmons votre réservation.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Erreur</h1>
            <p className="text-stone-700 mb-6">{error}</p>
            <button
              onClick={() => router.push('/panier')}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors"
            >
              Retour au panier
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Paiement confirmé !</h1>
          <p className="text-stone-700 mb-2">Votre réservation a été confirmée avec succès.</p>
          <p className="text-lg font-semibold text-stone-900 mb-6">
            Numéro de réservation : <span className="text-black">#{reservationId}</span>
          </p>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold mb-3">Prochaines étapes :</h2>
            <ul className="space-y-2 text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Un email de confirmation vous a été envoyé avec tous les détails de votre réservation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Votre acompte a été payé avec succès.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">→</span>
                <span>Le solde restant sera à régler lors de la récupération ou livraison.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 border-4 border-stone-200 border-t-black rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
