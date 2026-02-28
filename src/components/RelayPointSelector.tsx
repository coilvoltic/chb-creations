'use client'

import { useState } from 'react'
import AddressAutocomplete from './AddressAutocomplete'

export type RelayProvider = 'chronopost' | 'mondialrelay'

export interface RelayPoint {
  id: string
  name: string
  address: string
  distance: number // en km
  provider: RelayProvider
}

interface RelayPointSelectorProps {
  customerAddress: string
  onAddressChange: (address: string) => void
  selectedProvider: RelayProvider | null
  onProviderSelect: (provider: RelayProvider | null) => void
  selectedRelayPoint: RelayPoint | null
  onRelayPointSelect: (relayPoint: RelayPoint) => void
}

export default function RelayPointSelector({
  customerAddress,
  onAddressChange,
  selectedProvider,
  onProviderSelect,
}: RelayPointSelectorProps) {
  const [isAddressValidated, setIsAddressValidated] = useState(false)

  const handleAddressSelect = (address: string) => {
    onAddressChange(address)
    setIsAddressValidated(true)
  }

  const handleAddressChange = (value: string) => {
    onAddressChange(value)
    // Réinitialiser la validation si l'utilisateur modifie l'adresse
    if (isAddressValidated) {
      setIsAddressValidated(false)
      // Réinitialiser le transporteur si l'adresse change
      if (selectedProvider) {
        onProviderSelect(null)
      }
    }
  }

  const handleProviderChange = (provider: RelayProvider) => {
    onProviderSelect(provider)
  }

  const getProviderDelay = (provider: RelayProvider) => {
    if (provider === 'chronopost') return '1 à 2 jours'
    return '4 à 5 jours'
  }

  return (
    <div className="space-y-4">
      {/* Adresse du client */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Votre adresse
        </label>
        <AddressAutocomplete
          value={customerAddress}
          onChange={handleAddressChange}
          onSelect={handleAddressSelect}
          placeholder="Entrez votre adresse complète"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
        <p className="text-xs text-stone-500 mt-1">
          Le point relais le plus proche de votre adresse sera sélectionné et communiqué ultérieurement
        </p>
      </div>

      {/* Choix du transporteur - Affiché uniquement si l'adresse est validée */}
      {isAddressValidated && customerAddress && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">
            Choisissez votre transporteur
          </label>

          {/* Chronopost */}
          <label className={`flex items-start cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-green-50 ${
            selectedProvider === 'chronopost' ? 'border-green-600 bg-green-50' : 'border-stone-300 bg-white'
          }`}>
            <input
              type="radio"
              name="relayProvider"
              value="chronopost"
              checked={selectedProvider === 'chronopost'}
              onChange={() => handleProviderChange('chronopost')}
              className="mr-3 w-5 h-5 cursor-pointer mt-0.5"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-base">Chronopost</span>
                <span className="text-green-700 font-bold">18,99 €</span>
              </div>
              <p className="text-xs text-stone-600">
                Livraison en {getProviderDelay('chronopost')} (hors délais de confection)
              </p>
            </div>
          </label>

          {/* Mondial Relay */}
          <label className={`flex items-start cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-green-50 ${
            selectedProvider === 'mondialrelay' ? 'border-green-600 bg-green-50' : 'border-stone-300 bg-white'
          }`}>
            <input
              type="radio"
              name="relayProvider"
              value="mondialrelay"
              checked={selectedProvider === 'mondialrelay'}
              onChange={() => handleProviderChange('mondialrelay')}
              className="mr-3 w-5 h-5 cursor-pointer mt-0.5"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-base">Mondial Relay</span>
                <span className="text-green-700 font-bold">0,5 €</span>
              </div>
              <p className="text-xs text-stone-600">
                Livraison en {getProviderDelay('mondialrelay')} (hors délais de confection)
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}
