'use client'

import { useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: number
  title?: string
  message?: string
}

export default function SuccessModal({
  isOpen,
  onClose,
  reservationId,
  title = 'Réservation confirmée !',
  message = 'Nous vous contacterons bientôt pour finaliser les détails.',
}: SuccessModalProps) {
  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Empêcher le scroll quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-dark max-w-md w-full p-8 animate-scale-in pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-black transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>

          {/* Contenu */}
          <div className="text-center">
            {/* Icône de succès */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>

            {/* Titre */}
            <h2 className="text-2xl font-bold text-black mb-3 font-satisfy">
              {title}
            </h2>

            {/* Numéro de réservation */}
            <div className="bg-stone-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-stone-600 mb-1">Numéro de réservation</p>
              <p className="text-3xl font-bold text-black">#{reservationId}</p>
            </div>

            {/* Message */}
            <p className="text-stone-600 mb-8 leading-relaxed">
              {message}
            </p>

            {/* Bouton */}
            <button
              onClick={onClose}
              className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors font-medium"
            >
              Retour à l'accueil
            </button>

            {/* Note */}
            <p className="text-xs text-stone-500 mt-4">
              Un email de confirmation vous a été envoyé.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
