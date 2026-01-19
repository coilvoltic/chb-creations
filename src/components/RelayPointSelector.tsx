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
  onProviderSelect: (provider: RelayProvider) => void
  selectedRelayPoint: RelayPoint | null
  onRelayPointSelect: (relayPoint: RelayPoint) => void
}

export default function RelayPointSelector({
  customerAddress,
  onAddressChange,
  selectedProvider,
  onProviderSelect,
  selectedRelayPoint,
  onRelayPointSelect,
}: RelayPointSelectorProps) {
  const [showRelayPoints, setShowRelayPoints] = useState(false)
  const [isLoadingRelayPoints, setIsLoadingRelayPoints] = useState(false)
  const [relayPoints, setRelayPoints] = useState<RelayPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearchRelayPoints = async () => {
    if (!customerAddress.trim()) {
      setError('Veuillez saisir une adresse')
      return
    }

    if (!selectedProvider) {
      setError('Veuillez sélectionner un transporteur')
      return
    }

    setIsLoadingRelayPoints(true)
    setShowRelayPoints(true)
    setError(null)

    try {
      const response = await fetch('/api/find-relay-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerAddress: customerAddress.trim(),
          provider: selectedProvider,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche')
      }

      setRelayPoints(data.relayPoints || [])
    } catch (err) {
      console.error('Erreur recherche points relais:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche des points relais')
      setRelayPoints([])
    } finally {
      setIsLoadingRelayPoints(false)
    }
  }

  const handleProviderChange = (provider: RelayProvider) => {
    onProviderSelect(provider)
    // Don't call onRelayPointSelect with null, just reset the local state
    setRelayPoints([])
    setShowRelayPoints(false)

    // Mettre à jour les frais immédiatement selon le transporteur sélectionné
    // Les frais seront mis à jour via le handler parent qui appellera setPurchaseRelayPoint
  }

  const getProviderLabel = (provider: RelayProvider) => {
    if (provider === 'chronopost') return 'Chronopost'
    return 'Mondial Relay'
  }

  const getProviderPrice = (provider: RelayProvider) => {
    if (provider === 'chronopost') return 18.99
    return 9.99
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
          Votre adresse (pour trouver des points relais à proximité)
        </label>
        <AddressAutocomplete
          value={customerAddress}
          onChange={onAddressChange}
          onSelect={onAddressChange}
          placeholder="Entrez votre adresse"
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Choix du transporteur - Affiché uniquement si l'adresse est complète (au moins 10 caractères) */}
      {customerAddress && customerAddress.trim().length >= 10 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-stone-700">
            Choisissez votre transporteur
          </label>

          {/* Chronopost */}
          <label className="flex items-start cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-green-50 bg-white">
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
                {getProviderDelay('chronopost')} (hors délais de confection)
              </p>
            </div>
          </label>

          {/* Mondial Relay */}
          <label className="flex items-start cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-green-50 bg-white">
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
                <span className="text-green-700 font-bold">9,99 €</span>
              </div>
              <p className="text-xs text-stone-600">
                {getProviderDelay('mondialrelay')} (hors délais de confection)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Bouton de recherche des points relais */}
      {selectedProvider && customerAddress && (
        <>
          <button
            onClick={handleSearchRelayPoints}
            disabled={isLoadingRelayPoints}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingRelayPoints ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Recherche en cours...
              </span>
            ) : (
              `Voir les points relais ${getProviderLabel(selectedProvider)}`
            )}
          </button>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </>
      )}

      {/* Message si aucun point relais trouvé */}
      {showRelayPoints && !isLoadingRelayPoints && relayPoints.length === 0 && !error && (
        <div className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg">
          Aucun point relais trouvé pour cette adresse. Veuillez vérifier l'adresse saisie.
        </div>
      )}

      {/* Liste des points relais */}
      {showRelayPoints && !isLoadingRelayPoints && relayPoints.length > 0 && (
        <div className="border border-green-300 rounded-lg p-4 bg-green-50 space-y-3">
          <h4 className="font-semibold text-sm text-green-900 mb-3">
            Points relais {getProviderLabel(selectedProvider!)} à proximité
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {relayPoints.map((point) => (
              <label
                key={point.id}
                className={`flex items-start cursor-pointer p-3 border rounded-lg transition-colors bg-white hover:border-green-500 ${
                  selectedRelayPoint?.id === point.id ? 'border-green-600 bg-green-50' : 'border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="relayPoint"
                  value={point.id}
                  checked={selectedRelayPoint?.id === point.id}
                  onChange={() => onRelayPointSelect(point)}
                  className="mr-3 w-5 h-5 cursor-pointer mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-stone-900">{point.name}</div>
                  <div className="text-xs text-stone-600 mt-1">{point.address}</div>
                  <div className="text-xs text-green-700 font-medium mt-1">
                    📍 À {point.distance.toFixed(1)} km
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Résumé de la sélection */}
      {selectedRelayPoint && (
        <div className="bg-white border border-green-300 p-3 rounded-lg">
          <p className="font-medium text-sm text-green-900 mb-1">Point relais sélectionné</p>
          <p className="text-sm text-stone-800">{selectedRelayPoint.name}</p>
          <p className="text-xs text-stone-600">{selectedRelayPoint.address}</p>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-green-200">
            <span className="text-xs text-stone-600">Frais de livraison :</span>
            <span className="font-bold text-green-700">{getProviderPrice(selectedProvider!).toFixed(2)} €</span>
          </div>
          <div className="text-xs text-stone-600 mt-1">
            Délai : {getProviderDelay(selectedProvider!)} (hors délais de confection)
          </div>
        </div>
      )}
    </div>
  )
}
