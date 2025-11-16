'use client'

import { useState, useEffect, useRef } from 'react'

interface AddressPrediction {
  description: string
  placeId: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: string) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Adresse complète de livraison',
  className = '',
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Rechercher les suggestions d'adresse avec debounce
  const fetchPredictions = async (input: string) => {
    if (input.trim().length < 3) {
      setPredictions([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/autocomplete-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })

      const data = await response.json()
      setPredictions(data.predictions || [])
      setShowDropdown(data.predictions && data.predictions.length > 0)
    } catch (error) {
      console.error('Erreur autocomplete:', error)
      setPredictions([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Debounce: attendre 300ms après la dernière frappe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fetchPredictions(newValue)
    }, 300)
  }

  const handleSelectPrediction = (prediction: AddressPrediction) => {
    onChange(prediction.description)
    onSelect(prediction.description)
    setShowDropdown(false)
    setPredictions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-stone-200 border-t-black rounded-full animate-spin"></div>
        </div>
      )}

      {/* Dropdown des suggestions */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className={`w-full text-left px-4 py-3 hover:bg-stone-100 transition-colors ${
                index !== predictions.length - 1 ? 'border-b border-stone-200' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-stone-500 mt-0.5 flex-shrink-0"
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
                <span className="text-sm text-stone-700">{prediction.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message si aucune suggestion */}
      {showDropdown && !isLoading && predictions.length === 0 && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-300 rounded-lg shadow-lg px-4 py-3">
          <p className="text-sm text-stone-500">Aucune adresse trouvée</p>
        </div>
      )}
    </div>
  )
}
