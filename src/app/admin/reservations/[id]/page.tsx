'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Reservation } from '@/lib/supabase'

interface ReservationItem {
  id: number
  reservation_id: number
  product_id: number
  quantity: number
  rental_start: string
  rental_end: string
  options: {
    selectedOptions?: Array<{
      option_type_name: string
      name: string
      description?: string
      additional_fee: number
    }>
    installationFees?: number
  } | null
  personalizations: { [key: string]: string } | null
  needs_installation: boolean
  products: {
    name: string
    slug: string
    images: string[]
  }
}

interface ReservationDetail {
  reservation: Reservation
  items: ReservationItem[]
}

export default function ReservationDetailPage() {
  const [data, setData] = useState<ReservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  useEffect(() => {
    if (id) {
      loadReservationDetail()
    }
  }, [id])

  const loadReservationDetail = async () => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`)

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la réservation')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les détails de la réservation')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800 border-green-200' },
      CONFIRMED_NO_DEPOSIT: { label: 'Confirmée (sans acompte)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800 border-red-200' },
      DONE: { label: 'Terminée', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' }

    return (
      <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Réservation non trouvée'}</p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  const { reservation, items } = data

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-stone-600 hover:text-black transition-colors"
              >
                ← Retour
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">Réservation #{reservation.id}</h1>
                <p className="text-sm text-stone-600">Créée le {formatDate(reservation.created_at)}</p>
              </div>
            </div>
            {getStatusBadge(reservation.reservation_status)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Informations client */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Informations client</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Nom complet</p>
                  <p className="text-sm font-medium text-black">
                    {reservation.customer_infos.firstName} {reservation.customer_infos.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-black">{reservation.customer_infos.email}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Téléphone</p>
                  <p className="text-sm text-black">{reservation.customer_infos.phone}</p>
                </div>
              </div>

              <hr className="my-6 border-stone-200" />

              <h3 className="text-lg font-semibold text-black mb-4">Détails financiers</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-stone-600">Montant total</span>
                  <span className="text-sm font-semibold text-black">{reservation.total_price.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone-600">Acompte</span>
                  <span className="text-sm font-semibold text-blue-600">{(reservation.deposit ?? 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone-600">Caution</span>
                  <span className="text-sm font-semibold text-amber-600">{(reservation.caution ?? 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-stone-600">Frais de livraison</span>
                  <span className="text-sm font-semibold text-black">{reservation.delivery_fees?.toFixed(2) || '0.00'} €</span>
                </div>
              </div>

              <hr className="my-6 border-stone-200" />

              <h3 className="text-lg font-semibold text-black mb-4">Livraison</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Option</p>
                  <p className="text-sm text-black">
                    {reservation.delivery_option === 'delivery' ? '🚚 Livraison' : '🏪 Retrait en boutique'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Articles de la réservation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-lg font-semibold text-black mb-6">
                Articles ({items.length})
              </h2>

              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      {/* Image produit */}
                      {item.products.images && item.products.images.length > 0 && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                          <img
                            src={item.products.images[0]}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Détails produit */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-2">{item.products.name}</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-stone-500">Quantité</p>
                            <p className="text-black font-medium">×{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-stone-500">Période de location</p>
                            <p className="text-black font-medium">
                              {formatDateOnly(item.rental_start)} → {formatDateOnly(item.rental_end)}
                            </p>
                          </div>
                        </div>

                        {/* Options sélectionnées */}
                        {item.options?.selectedOptions && item.options.selectedOptions.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Options sélectionnées</p>
                            <div className="space-y-1">
                              {item.options.selectedOptions.map((option, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">{option.option_type_name}</p>
                                    <p className="text-xs text-blue-700">{option.name}</p>
                                    {option.description && (
                                      <p className="text-xs text-blue-600 mt-1">{option.description}</p>
                                    )}
                                  </div>
                                  {option.additional_fee > 0 && (
                                    <span className="text-sm font-semibold text-blue-900">+{option.additional_fee.toFixed(0)}€</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Personnalisations */}
                        {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">✏️ Personnalisations</p>
                            <div className="space-y-1">
                              {Object.entries(item.personalizations).map(([key, value], idx) => (
                                <div key={idx} className="bg-purple-50 border border-purple-200 rounded px-3 py-2">
                                  <p className="text-xs text-purple-700 font-medium">{key}</p>
                                  <p className="text-sm text-purple-900">{value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Installation */}
                        {item.needs_installation && (
                          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                            <p className="text-sm text-green-900">
                              ✓ Service d&apos;installation demandé
                              {item.options?.installationFees && (
                                <span className="ml-2 font-semibold">({item.options.installationFees.toFixed(2)} €)</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
