'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation } from '@/lib/supabase'
import Loader from '@/components/Loader'
import ReservationCalendar from '@/components/ReservationCalendar'

interface OrderWithReservations extends CustomerOrder {
  rental_reservations: RentalReservation[]
  purchase_reservations: PurchaseReservation[]
  prestation_reservations: PrestationReservation[]
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderWithReservations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/admin/reservations')

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commandes')
      }

      const data = await response.json()
      console.log('Orders received:', data.orders)
      // Log prestation reservations for debugging
      data.orders?.forEach((order: OrderWithReservations) => {
        if (order.prestation_reservations && order.prestation_reservations.length > 0) {
          console.log(`Order ${order.order_number} has ${order.prestation_reservations.length} prestation(s)`)
        }
      })
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les commandes')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800' },
      CONFIRMED_NO_DEPOSIT: { label: 'Confirmée (sans acompte)', color: 'bg-blue-100 text-blue-800' },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
      DONE: { label: 'Terminée', color: 'bg-gray-100 text-gray-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1 md:mb-2">Administration</h1>
              <p className="text-sm text-stone-600 font-cinzel">CHB Créations<span className="text-sm text-stone-600 font-sans"> - Gestion des réservations</span></p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => router.push('/admin/products')}
                className="p-2 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors"
                title="Gérer les produits"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Header avec bouton de bascule */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-black">
                Commandes ({orders.length})
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {viewMode === 'list'
                  ? 'Triées par date de création (plus récentes en premier)'
                  : 'Vue calendrier des réservations'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Liste</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-black text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Calendrier</span>
              </button>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <p className="text-stone-500">Aucune commande pour le moment</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <ReservationCalendar
            orders={orders}
            onOrderClick={(orderId) => router.push(`/admin/reservations/${orderId}`)}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      N° Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Sous-réservations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {orders.map((order) => {
                    // Get first reservation (rental, purchase or prestation) for display
                    const firstRental = order.rental_reservations[0]
                    const firstPurchase = order.purchase_reservations[0]
                    const firstPrestation = order.prestation_reservations[0]
                    const firstReservation = firstRental || firstPurchase || firstPrestation

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-stone-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/reservations/${order.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black tracking-wide">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-black">
                            {order.customer_infos.firstName} {order.customer_infos.lastName}
                          </div>
                          <div className="text-xs text-stone-500">{order.customer_infos.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black">
                          {order.total_price.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                          <div className="flex flex-col gap-1">
                            <div className="text-xs text-stone-500">
                              {order.rental_reservations.length > 0 && (
                                <span>Location</span>
                              )}
                              {order.rental_reservations.length > 0 && (order.purchase_reservations.length > 0 || order.prestation_reservations.length > 0) && (
                                <span> • </span>
                              )}
                              {order.purchase_reservations.length > 0 && (
                                <span>Achat</span>
                              )}
                              {order.purchase_reservations.length > 0 && order.prestation_reservations.length > 0 && (
                                <span> • </span>
                              )}
                              {order.prestation_reservations.length > 0 && (
                                <span>Prestation</span>
                              )}
                            </div>
                            {firstReservation && firstReservation.delivery_address && (
                              <div className="text-xs">
                                <span className="text-green-700" title={firstReservation.delivery_address}>📦 Livraison</span>
                              </div>
                            )}
                            {firstReservation && !firstReservation.delivery_address && (
                              <div className="text-xs">
                                <span className="text-stone-500">🏪 Retrait</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {firstReservation ? getStatusBadge(firstReservation.reservation_status) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/reservations/${order.id}`)
                            }}
                            className="text-black hover:text-stone-600 font-medium"
                          >
                            Voir détails →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Styles pour scrollbar réduite */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f4;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a29e;
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d6d3d1 #f5f5f4;
        }
      `}</style>
    </div>
  )
}
