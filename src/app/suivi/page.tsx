'use client'

import Navbar from '@/components/Navbar'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Package, Calendar, MapPin, CheckCircle, Clock, XCircle, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { TIME_SLOT_LABELS, getSupabaseClient } from '@/lib/supabase'
import type { ReservationStatus } from '@/lib/supabase'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'

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
  const [activeTab, setActiveTab] = useState<'tracking' | 'account'>('tracking')
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [userOrders, setUserOrders] = useState<OrderData[]>([])
  const [lastFetchedEmail, setLastFetchedEmail] = useState<string | null>(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set())

  const supabase = useMemo(() => getSupabaseClient(), [])

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Fetch all orders for authenticated user (useCallback to stabilize the function)
  const fetchUserOrders = useCallback(async (userEmail: string) => {
    // Éviter les appels redondants
    if (userEmail === lastFetchedEmail) {
      return
    }

    setLastFetchedEmail(userEmail)

    try {
      const response = await fetch(`/api/orders/user?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Error fetching user orders:', data.error)
        return
      }

      setUserOrders(data.orders || [])
    } catch (err) {
      console.error('Error fetching user orders:', err)
    }
  }, [lastFetchedEmail])

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsLoadingAuth(false)

      // If user is logged in, fetch their orders
      if (session?.user?.email) {
        await fetchUserOrders(session.user.email)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ne fetch que sur les événements pertinents
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null)

        if (session?.user?.email) {
          await fetchUserOrders(session.user.email)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserOrders([])
        setLastFetchedEmail(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserOrders])

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/suivi`,
        },
      })

      if (error) {
        console.error('Error logging in with Google:', error)
        setError('Erreur lors de la connexion avec Google')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Erreur lors de la connexion')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUserOrders([])
      setOrderData(null)
    } catch (err) {
      console.error('Error logging out:', err)
    }
  }

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Mon espace</h1>
          <p className="text-stone-600 text-lg">
            Suivez vos commandes et gérez votre compte
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 px-4 py-3 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'tracking'
                  ? 'border-black text-black'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              Suivi de commande
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 px-4 py-3 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-black text-black'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              Mon compte
            </button>
          </div>
        </div>

        {/* Tab Content: Order Tracking */}
        {activeTab === 'tracking' && (
          <>
            {/* Search Form */}
            <div className="max-w-2xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="bg-white border border-stone-200 rounded-lg p-6 md:p-8">
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
                  <div className="mt-2 md:mt-4 p-3 bg-amber-50 rounded-lg text-sm">
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
          </>
        )}

        {/* Tab Content: Account */}
        {activeTab === 'account' && (
          <div className="max-w-2xl mx-auto">
            {isLoadingAuth ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-stone-300 border-t-black rounded-full animate-spin"></div>
              </div>
            ) : user ? (
              /* User is logged in */
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="bg-white border border-stone-200 rounded-xl p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Bienvenue</h2>
                      <p className="text-stone-600">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter
                    </button>
                  </div>

                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-semibold mb-4">Mes commandes</h3>
                    {userOrders.length > 0 ? (
                      <p className="text-stone-600 text-sm mb-4">
                        Vous avez {userOrders.length} commande(s)
                      </p>
                    ) : (
                      <p className="text-stone-600 text-sm">
                        Vous n&apos;avez pas encore de commandes.
                      </p>
                    )}
                  </div>
                </div>

                {/* Display all user orders */}
                {userOrders.map((orderData) => {
                  const isExpanded = expandedOrderIds.has(orderData.order.id)
                  const totalReservations =
                    orderData.rentalReservations.length +
                    orderData.purchaseReservations.length +
                    orderData.prestationReservations.length

                  return (
                    <div key={orderData.order.id} className="border border-stone-200 rounded-lg overflow-hidden">
                      {/* Order Header - Always Visible - Clickable */}
                      <button
                        onClick={() => toggleOrderExpansion(orderData.order.id)}
                        className="w-full p-4 md:p-6 text-left hover:bg-stone-50 transition-colors bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-lg md:text-xl font-bold">Commande #{orderData.order.orderNumber}</h2>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-stone-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-stone-600" />
                              )}
                            </div>
                            <p className="text-stone-600 text-sm">
                              {new Date(orderData.order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })} • {totalReservations} réservation(s)
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl md:text-2xl font-bold">{orderData.order.totalPrice.toFixed(2)} €</p>
                          </div>
                        </div>
                      </button>

                      {/* Order Details - Expandable */}
                      {isExpanded && (
                        <div className="border-t border-stone-200 p-4 md:p-6 space-y-4 bg-stone-50">
                          {/* Customer Info */}
                          <div className="bg-white p-4 rounded-lg border border-stone-200">
                            <h3 className="font-semibold mb-3 text-sm">Informations client</h3>
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

                    {/* Rental Reservations */}
                    {orderData.rentalReservations.map((reservation) => (
                      <div key={reservation.id} className="bg-white border-l-4 border-l-blue-500 border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                              <h3 className="font-bold text-sm">Location</h3>
                              <p className="text-xs text-stone-600">{reservation.rental_items?.length || 0} article(s)</p>
                            </div>
                          </div>
                          {getStatusDisplay(reservation.reservation_status)}
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-3">
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
                          <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Livraison : {reservation.delivery_address}</p>
                              {reservation.delivery_fees > 0 && (
                                <p className="text-blue-600 text-xs mt-1">Frais : {reservation.delivery_fees.toFixed(2)} €</p>
                              )}
                            </div>
                          </div>
                        )}

                        {reservation.deposit > 0 && (
                          <div className="mt-2 mb:mt-4 bg-amber-50 rounded-lg p-2 text-xs text-amber-800">
                            <span className="font-medium">Acompte :</span> {reservation.deposit.toFixed(2)} €
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Purchase Reservations */}
                    {orderData.purchaseReservations.map((reservation) => (
                      <div key={reservation.id} className="bg-white border-l-4 border-l-green-500 border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-green-600" />
                            <div>
                              <h3 className="font-bold text-sm">Achat</h3>
                              <p className="text-xs text-stone-600">{reservation.purchase_items?.length || 0} article(s)</p>
                            </div>
                          </div>
                          {getStatusDisplay(reservation.reservation_status)}
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-3">
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
                          <div className="bg-green-50 rounded-lg p-3 flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">Livraison : {reservation.delivery_address}</p>
                              {reservation.delivery_fees > 0 && (
                                <p className="text-green-600 text-xs mt-1">Frais : {reservation.delivery_fees.toFixed(2)} €</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Prestation Reservations */}
                    {orderData.prestationReservations.map((reservation) => (
                      <div key={reservation.id} className="bg-white border-l-4 border-l-purple-500 border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            <div>
                              <h3 className="font-bold text-sm">Prestation</h3>
                              <p className="text-xs text-stone-600">{reservation.prestation_items?.length || 0} prestation(s)</p>
                            </div>
                          </div>
                          {getStatusDisplay(reservation.reservation_status)}
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-3">
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
                          <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-purple-900">Prestation : {reservation.delivery_address}</p>
                              {reservation.delivery_fees > 0 && (
                                <p className="text-purple-600 text-xs mt-1">Frais : {reservation.delivery_fees.toFixed(2)} €</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* User is not logged in - Show login button */
              <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-soft">
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Connexion</h2>
                    <p className="text-stone-600">
                      Connectez-vous pour accéder à vos commandes et gérer votre compte
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border-2 border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Se connecter avec Google</span>
                  </button>

                  <p className="text-xs text-stone-500">
                    En vous connectant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
