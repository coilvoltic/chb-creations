'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Loader from '@/components/Loader'
import { ChevronDown, ChevronUp, Package, Calendar, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react'
import Image from 'next/image'
import type { CustomerOrder, ReservationStatus } from '@/lib/supabase'

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
  nb_of_people: number
  prestation_start: string | null
  prestation_end: string | null
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

interface UserOrder extends CustomerOrder {
  rental_reservations?: RentalReservation[]
  purchase_reservations?: PurchaseReservation[]
  prestation_reservations?: PrestationReservation[]
}

// Order Card Component with expansion
function OrderCard({
  order,
  isExpanded,
  onToggle,
  getStatusDisplay
}: {
  order: UserOrder
  isExpanded: boolean
  onToggle: () => void
  getStatusDisplay: (status: ReservationStatus) => React.ReactElement
}) {
  const getOrderTypeLabel = () => {
    const types = []
    if ((order.rental_reservations?.length || 0) > 0) types.push('Location')
    if ((order.purchase_reservations?.length || 0) > 0) types.push('Achat')
    if ((order.prestation_reservations?.length || 0) > 0) types.push('Prestation')
    return types.join(' • ')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      {/* Order Header - Always Visible - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 md:p-6 text-left hover:bg-stone-50 transition-colors bg-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-black">
                {order.order_number}
              </h3>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-stone-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-stone-600" />
              )}
            </div>
            <p className="text-sm text-stone-600">
              {getOrderTypeLabel()} • Commandé le {formatDate(order.created_at)}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-xl md:text-2xl font-bold text-black">
              {order.total_price.toFixed(2)} €
            </p>
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
                {order.customer_infos.firstName} {order.customer_infos.lastName}
              </p>
              <p>
                <span className="text-stone-600">Email :</span> {order.customer_infos.email}
              </p>
              <p>
                <span className="text-stone-600">Téléphone :</span> {order.customer_infos.phone}
              </p>
            </div>
            {order.promotional_code_name && order.promotional_code_discount && (
              <div className="mt-3 pt-3 border-t border-stone-200">
                <p className="text-sm text-green-700 font-medium">
                  <span className="text-stone-600">Code promo :</span> {order.promotional_code_name} (-{order.promotional_code_discount}%)
                </p>
              </div>
            )}
          </div>

          {/* Rental Reservations */}
          {order.rental_reservations?.map((reservation) => (
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
                <div className={`mt-2 rounded-lg p-2 text-xs ${reservation.reservation_status === 'CONFIRMED' || reservation.reservation_status === 'DONE' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                  <span className="font-medium">
                    {reservation.reservation_status === 'CONFIRMED' || reservation.reservation_status === 'DONE' ? '✓ Déjà payé :' : 'Acompte :'}
                  </span> {reservation.deposit.toFixed(2)} €
                </div>
              )}
            </div>
          ))}

          {/* Purchase Reservations */}
          {order.purchase_reservations?.map((reservation) => (
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
          {order.prestation_reservations?.map((reservation) => (
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
                      <p className="text-sm text-stone-600">Nombre de personnes : {item.nb_of_people}</p>
                      {item.prestation_start && item.prestation_end && (
                        <div className="space-y-1 mt-1">
                          <div className="flex items-center gap-1 text-sm text-purple-700">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(item.prestation_start).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(item.prestation_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(item.prestation_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
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
}

export default function ComptePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set())
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingEmail, setTrackingEmail] = useState('')
  const [trackingError, setTrackingError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadUserOrders(session.user.id)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserOrders = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/orders?user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/compte`,
        },
      })
      if (error) {
        console.error('Error signing in:', error)
      }
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setOrders([])
      setExpandedOrderIds(new Set())
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleTrackOrder = async () => {
    setTrackingError('')

    // Validation
    if (!trackingNumber.trim()) {
      setTrackingError('Veuillez entrer un numéro de commande')
      return
    }
    if (!trackingEmail.trim()) {
      setTrackingError('Veuillez entrer votre adresse email')
      return
    }

    // Vérifier que l'email est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trackingEmail.trim())) {
      setTrackingError('Veuillez entrer une adresse email valide')
      return
    }

    try {
      // Appeler l'API pour vérifier la commande
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: trackingNumber.trim(),
          email: trackingEmail.trim().toLowerCase(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.order) {
        // Afficher la commande dans la liste
        setOrders([data.order])
        setExpandedOrderIds(new Set([data.order.id]))
        setTrackingNumber('')
        setTrackingEmail('')
      } else {
        setTrackingError(data.error || 'Commande introuvable. Vérifiez le numéro et l\'email.')
      }
    } catch (error) {
      console.error('Error tracking order:', error)
      setTrackingError('Une erreur est survenue. Veuillez réessayer.')
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
      PENDING: {
        label: 'En attente de paiement',
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

  if (loading) {
    return <Loader />
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-stone-50 pt-12 md:pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Mon compte
            </h1>
            <p className="text-stone-600 max-w-2xl mx-auto">
              {user
                ? 'Consultez vos commandes et gérez votre compte'
                : 'Connectez-vous pour accéder à vos commandes ou suivez une commande sans compte'}
            </p>
          </div>

          {!user && orders.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              {/* Bloc unique avec connexion Google et suivi sans compte */}
              <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 md:p-12">
                {/* Section connexion Google */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-stone-200 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="h-8 w-8"
                    >
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-black mb-2">
                    Connectez-vous avec Google
                  </h2>
                  <p className="text-base md:text-sm text-stone-600">
                    Accédez à toutes vos commandes en un clic
                  </p>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white border-2 border-stone-300 hover:border-black text-black font-medium py-2 md:py-4 px-6 rounded-md md:rounded-xl transition-all flex items-center justify-center gap-3 group"
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
                  <span className="text-sm md:text-lg">Se connecter avec Google</span>
                </button>

                <div className="mt-6 text-center text-base md:text-sm text-stone-500">
                  Vos informations sont sécurisées et ne seront jamais partagées.
                </div>

                {/* Trait horizontal séparateur */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-stone-500">ou</span>
                  </div>
                </div>

                {/* Section suivi sans compte */}
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-black mb-2">
                      Suivre une commande sans compte
                    </h3>
                    <p className="text-sm text-stone-600">
                      Entrez votre numéro de commande et votre adresse email
                    </p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                      placeholder="Numéro de commande (ex: 1234567890)"
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <input
                      type="email"
                      value={trackingEmail}
                      onChange={(e) => setTrackingEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                      placeholder="Adresse email"
                      className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    {trackingError && (
                      <p className="text-sm text-red-600">{trackingError}</p>
                    )}
                    <button
                      onClick={handleTrackOrder}
                      className="w-full bg-black hover:bg-stone-800 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Suivre ma commande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* User Info Section - Only show if user is logged in */}
              {user && (
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8 mb-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {user.user_metadata?.avatar_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden relative">
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">
                            {user.user_metadata?.full_name?.[0] || user.email?.[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-black">
                          {user.user_metadata?.full_name || 'Utilisateur'}
                        </h2>
                        <p className="text-stone-600">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}

              {/* Orders Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-black">
                    {user ? 'Mes commandes' : 'Commande trouvée'} ({orders.length})
                  </h2>
                  {!user && orders.length > 0 && (
                    <button
                      onClick={() => {
                        setOrders([])
                        setExpandedOrderIds(new Set())
                        setTrackingNumber('')
                        setTrackingEmail('')
                      }}
                      className="text-sm text-stone-600 hover:text-black transition-colors"
                    >
                      ← Rechercher une autre commande
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-stone-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <p className="text-stone-500 mb-4">Aucune commande pour le moment</p>
                    <button
                      onClick={() => router.push('/')}
                      className="text-black hover:underline font-medium"
                    >
                      Découvrir nos produits →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isExpanded={expandedOrderIds.has(order.id)}
                        onToggle={() => toggleOrderExpansion(order.id)}
                        getStatusDisplay={getStatusDisplay}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
