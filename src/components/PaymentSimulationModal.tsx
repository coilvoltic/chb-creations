'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface PaymentSimulationModalProps {
  isOpen: boolean
  depositAmount: number
  onConfirm: () => void
  onCancel: () => void
}

export default function PaymentSimulationModal({
  isOpen,
  depositAmount,
  onConfirm,
  onCancel,
}: PaymentSimulationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple-pay' | null>(null)

  if (!isOpen) return null

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsProcessing(false)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-scale-in">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Paiement de l'acompte</h2>
          <p className="text-stone-600">
            Montant à payer : <span className="font-bold text-black">{depositAmount.toFixed(2)} €</span>
          </p>
        </div>

        {/* Payment methods */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setPaymentMethod('card')}
            disabled={isProcessing}
            className={`w-full p-4 border-2 rounded-xl transition-all ${
              paymentMethod === 'card'
                ? 'border-black bg-stone-50'
                : 'border-stone-200 hover:border-stone-300'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Carte bancaire</div>
                <div className="text-sm text-stone-600">Visa, Mastercard, etc.</div>
              </div>
              {paymentMethod === 'card' && (
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => setPaymentMethod('apple-pay')}
            disabled={isProcessing}
            className={`w-full p-4 border-2 rounded-xl transition-all ${
              paymentMethod === 'apple-pay'
                ? 'border-black bg-stone-50'
                : 'border-stone-200 hover:border-stone-300'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Apple Pay</div>
                <div className="text-sm text-stone-600">Paiement rapide et sécurisé</div>
              </div>
              {paymentMethod === 'apple-pay' && (
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💳 Mode simulation</span>
            <br />
            Le paiement est actuellement simulé. Aucun montant ne sera débité.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={!paymentMethod || isProcessing}
            className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Traitement du paiement...</span>
              </>
            ) : (
              `Payer ${depositAmount.toFixed(2)} €`
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full border border-stone-300 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
