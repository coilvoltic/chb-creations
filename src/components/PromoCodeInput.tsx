'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Tag, X, Check, Loader } from 'lucide-react'

export default function PromoCodeInput() {
  const { cart, setPromoCode } = useCart()
  const [codeInput, setCodeInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApplyPromoCode = async () => {
    if (!codeInput.trim()) {
      setError('Veuillez saisir un code promo')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch('/api/validate-promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Code promo invalide')
        return
      }

      if (data.valid && data.promoCode) {
        setPromoCode({
          code: data.promoCode.code,
          discount: data.promoCode.discount,
        })
        setCodeInput('')
        setError(null)
      } else {
        setError('Code promo invalide')
      }
    } catch (err) {
      console.error('Error validating promo code:', err)
      setError('Erreur lors de la validation du code promo')
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemovePromoCode = () => {
    setPromoCode(undefined)
    setCodeInput('')
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyPromoCode()
    }
  }

  return (
    <div className="md:pt-1">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-stone-600" />
        <h3 className="font-semibold text-sm">Code promo</h3>
      </div>

      {cart.promoCode ? (
        // Code promo applied - show it with remove button
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">{cart.promoCode.code}</p>
                <p className="text-xs text-green-700">-{cart.promoCode.discount}% de réduction</p>
              </div>
            </div>
            <button
              onClick={handleRemovePromoCode}
              className="text-green-700 hover:text-green-900 transition-colors p-1"
              title="Retirer le code promo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        // Code promo input
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Entrez votre code"
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
              disabled={isValidating}
              />
            <button
              onClick={handleApplyPromoCode}
              disabled={isValidating || !codeInput.trim()}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
              {isValidating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Appliquer'
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-xs mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
