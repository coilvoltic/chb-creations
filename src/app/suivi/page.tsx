'use client'

import Navbar from '@/components/Navbar'
import { useState } from 'react'
import { Search, Package, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react'
import { TIME_SLOT_LABELS } from '@/lib/supabase'
import type { ReservationStatus } from '@/lib/supabase'
import Image from 'next/image'

interface ProductInfo {
  name: string
  images: string[]
  slug: string
  category: string
  subcategory: string
}

interface RentalItem {
  id: number
  quantity: number
  rental_start: string
  rental_end: string
  products: ProductInfo
}

interface PurchaseItem {
  id: number
  quantity: number
  products: ProductInfo
}

interface PrestationItem {
  id: number
  quantity: number
  prestation_date: string | null
  time_slot: string | null
  products: ProductInfo
}

interface RentalReservation {
  id: number
  reservation_status: ReservationStatus
  delivery_address: string | null
  delivery_fees: number
  deposit: number
  rental_items: RentalItem[]
}

interface PurchaseReservation {
  id: number
  reservation_status: ReservationStatus
  delivery_address: string | null
  delivery_fees: number
  purchase_items: PurchaseItem[]
}

interface PrestationReservation {
  id: number
  reservation_status: ReservationStatus
  delivery_address: string | null
  delivery_fees: number
  prestation_items: PrestationItem[]
}

interface OrderData {
  order: {
    id: number
    orderNumber: string
    totalPrice: number
    createdAt: string
    customerInfo: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  rentalReservations: RentalReservation[]
  purchaseReservations: PurchaseReservation[]
  prestationReservations: PrestationReservation[]
}

export default function OrderTrackingPage() {
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setError(null)
    setOrderData(null)

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orderNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la recherche')
      }

      setOrderData(data)
    } catch (err) {
      console.error('Erreur recherche commande:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche')
    } finally {
      setIsSearching(false)
    }
  }

  const getStatusDisplay = (status: ReservationStatus) => {
    const statusConfig = {
      CONFIRMED: {
        label: 'Confirmée',
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      CONFIRMED_NO_DEPOSIT: {
        label: 'En attente d\'acompte',
        icon: Clock,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
      DONE: {
        label: 'Terminée',
        icon: CheckCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      CANCELLED: {
        label: 'Annulée',
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Suivre ma commande</h1>
          <p className="text-stone-600 text-lg">
            Entrez votre email et votre numéro de commande pour suivre votre réservation
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-soft">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
                  Numéro de commande
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
                <p className="text-xs text-stone-500 mt-1">
                  Vous trouverez ce numéro dans l&apos;email de confirmation
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Recherche en cours...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Rechercher ma commande</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* Order Summary Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-soft">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Commande #{orderData.order.orderNumber}</h2>
                  <p className="text-stone-600">
                    Passée le {new Date(orderData.order.createdAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600 mb-1">Total</p>
                  <p className="text-2xl font-bold">{orderData.order.totalPrice.toFixed(2)} €</p>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4">
                <h3 className="font-semibold mb-2">Informations client</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="text-stone-600">Nom :</span>{' '}
                    {orderData.order.customerInfo.firstName} {orderData.order.customerInfo.lastName}
                  </p>
                  <p>
                    <span className="text-stone-600">Email :</span> {orderData.order.customerInfo.email}
                  </p>
                  <p>
                    <span className="text-stone-600">Téléphone :</span> {orderData.order.customerInfo.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Reservations */}
            {orderData.rentalReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white border-2 border-blue-200 rounded-2xl p-6 md:p-8 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Location</h3>
                      <p className="text-sm text-stone-600">{reservation.rental_items?.length || 0} article(s)</p>
                    </div>
                  </div>
                  {getStatusDisplay(reservation.reservation_status)}
                </div>

                {/* Items */}
                <div className="space-y-4 mb-4">
                  {reservation.rental_items?.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-stone-100 last:border-0">
                      <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {item.products?.images?.[0] && (
                          <Image
                            src={item.products.images[0]}
                            alt={item.products.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.products?.name}</h4>
                        <p className="text-sm text-stone-600">Quantité : {item.quantity}</p>
                        {item.rental_start && item.rental_end && (
                          <div className="flex items-center gap-1 text-sm text-blue-700 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(item.rental_start).toLocaleDateString('fr-FR')} -{' '}
                              {new Date(item.rental_end).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                {reservation.delivery_address && (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Livraison à domicile</p>
                      <p className="text-sm text-blue-700">{reservation.delivery_address}</p>
                      {reservation.delivery_fees > 0 && (
                        <p className="text-sm text-blue-600 mt-1">Frais de livraison : {reservation.delivery_fees.toFixed(2)} €</p>
                      )}
                    </div>
                  </div>
                )}

                {reservation.deposit > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
                    <p className="text-amber-800">
                      <span className="font-medium">Acompte :</span> {reservation.deposit.toFixed(2)} €
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Purchase Reservations */}
            {orderData.purchaseReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Achat</h3>
                      <p className="text-sm text-stone-600">{reservation.purchase_items?.length || 0} article(s)</p>
                    </div>
                  </div>
                  {getStatusDisplay(reservation.reservation_status)}
                </div>

                {/* Items */}
                <div className="space-y-4 mb-4">
                  {reservation.purchase_items?.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-stone-100 last:border-0">
                      <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {item.products?.images?.[0] && (
                          <Image
                            src={item.products.images[0]}
                            alt={item.products.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.products?.name}</h4>
                        <p className="text-sm text-stone-600">Quantité : {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                {reservation.delivery_address && (
                  <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Livraison à domicile</p>
                      <p className="text-sm text-green-700">{reservation.delivery_address}</p>
                      {reservation.delivery_fees > 0 && (
                        <p className="text-sm text-green-600 mt-1">Frais de livraison : {reservation.delivery_fees.toFixed(2)} €</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Prestation Reservations */}
            {orderData.prestationReservations.map((reservation) => (
              <div key={reservation.id} className="bg-white border-2 border-purple-200 rounded-2xl p-6 md:p-8 shadow-soft">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Prestation</h3>
                      <p className="text-sm text-stone-600">{reservation.prestation_items?.length || 0} prestation(s)</p>
                    </div>
                  </div>
                  {getStatusDisplay(reservation.reservation_status)}
                </div>

                {/* Items */}
                <div className="space-y-4 mb-4">
                  {reservation.prestation_items?.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-stone-100 last:border-0">
                      <div className="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {item.products?.images?.[0] && (
                          <Image
                            src={item.products.images[0]}
                            alt={item.products.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.products?.name}</h4>
                        <p className="text-sm text-stone-600">Quantité : {item.quantity}</p>
                        {item.prestation_date && (
                          <div className="flex items-center gap-1 text-sm text-purple-700 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(item.prestation_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {item.time_slot && (
                          <p className="text-sm text-purple-600 mt-1">
                            Créneau : {TIME_SLOT_LABELS[item.time_slot as keyof typeof TIME_SLOT_LABELS]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Info */}
                {reservation.delivery_address && (
                  <div className="bg-purple-50 rounded-lg p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">Prestation à domicile</p>
                      <p className="text-sm text-purple-700">{reservation.delivery_address}</p>
                      {reservation.delivery_fees > 0 && (
                        <p className="text-sm text-purple-600 mt-1">Frais de déplacement : {reservation.delivery_fees.toFixed(2)} €</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
