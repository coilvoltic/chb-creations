'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation, RentalItem, PurchaseItem, PrestationItem, Tag } from '@/lib/supabase'
import Loader from '@/components/Loader'
import ReservationCalendar from '@/components/ReservationCalendar'
import MaintenanceToggle from '@/components/MaintenanceToggle'

// Extended interfaces to include nested items (matching API response structure)
interface RentalReservationWithItems extends RentalReservation {
  rental_items: RentalItem[]
}

interface PurchaseReservationWithItems extends PurchaseReservation {
  purchase_items: PurchaseItem[]
}

interface PrestationReservationWithItems extends PrestationReservation {
  prestation_items: PrestationItem[]
}

interface OrderWithReservations extends CustomerOrder {
  rental_reservations: RentalReservationWithItems[]
  purchase_reservations: PurchaseReservationWithItems[]
  prestation_reservations: PrestationReservationWithItems[]
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderWithReservations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [syncingCalendar, setSyncingCalendar] = useState(false)
  const [syncResult, setSyncResult] = useState<{ message: string; isError: boolean } | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const filteredOrders = orders.filter((order) => {
    // Filtre par recherche texte
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      const fullName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`.toLowerCase()
      const orderNumber = String(order.order_number).toLowerCase()
      if (!fullName.includes(query) && !orderNumber.includes(query)) return false
    }

    // Filtre par tags : afficher la commande si au moins une sous-réservation contient l'un des tags sélectionnés
    if (selectedTagIds.length > 0) {
      const allReservations = [
        ...order.rental_reservations,
        ...order.purchase_reservations,
        ...order.prestation_reservations,
      ]
      const hasTag = allReservations.some((res) =>
        (res.tags || []).some((tag) => selectedTagIds.includes(tag.id))
      )
      if (!hasTag) return false
    }

    return true
  })

  useEffect(() => {
    loadOrders()
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (response.ok) {
        const data = await response.json()
        setAllTags(data.tags || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error)
    }
  }

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const clearTagFilters = () => {
    setSelectedTagIds([])
  }

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

  const handleSyncCalendar = async () => {
    setSyncingCalendar(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/admin/sync-calendar', { method: 'POST' })
      const data = await response.json()
      setSyncResult({ message: data.message, isError: !response.ok })
    } catch {
      setSyncResult({ message: 'Erreur lors de la synchronisation', isError: true })
    } finally {
      setSyncingCalendar(false)
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
      PENDING: { label: 'En attente de paiement', color: 'bg-amber-100 text-amber-800' },
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
                onClick={handleSyncCalendar}
                disabled={syncingCalendar}
                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Synchroniser Google Calendar (réservations CONFIRMED manquantes)"
              >
                {syncingCalendar ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              <MaintenanceToggle />
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
                onClick={() => router.push('/admin/settings')}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                title="Paramètres"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
        {syncResult && (
          <div className={`mb-6 p-4 border rounded-lg flex items-center justify-between ${syncResult.isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={syncResult.isError ? 'text-red-600' : 'text-green-700'}>{syncResult.message}</p>
            <button onClick={() => setSyncResult(null)} className="text-stone-400 hover:text-stone-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Header avec bouton de bascule */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-black">
                {`Commandes (${filteredOrders.length}${searchQuery.trim() ? ` / ${orders.length}` : ''})`}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {viewMode === 'list'
                  ? 'Triées par date de création (plus récentes en premier)'
                  : 'Vue calendrier des réservations'}
              </p>
            </div>
            <div className="flex gap-2 items-center">
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
          {viewMode === 'list' && (
            <div className="flex flex-col gap-3 mt-4">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Nom client ou n° commande..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-stone-400 w-full placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-stone-600">Filtrer par tags :</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTagFilter(tag.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        selectedTagIds.includes(tag.id)
                          ? 'ring-1 ring-offset-1'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color,
                        borderWidth: '1px',
                        ...(selectedTagIds.includes(tag.id) && { ringColor: tag.color }),
                      }}
                    >
                      {tag.name.length > 20 ? tag.name.slice(0, 20) + '…' : tag.name}
                    </button>
                  ))}
                  {selectedTagIds.length > 0 && (
                    <button
                      onClick={clearTagFilters}
                      className="text-xs text-stone-500 hover:text-stone-700 underline ml-2"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
                      Tags
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
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-stone-500">
                        Aucune commande ne correspond à votre recherche
                      </td>
                    </tr>
                  ) : filteredOrders.map((order) => {
                    // Get first reservation (rental, purchase or prestation) for display
                    const firstRental = order.rental_reservations[0]
                    const firstPurchase = order.purchase_reservations[0]
                    const firstPrestation = order.prestation_reservations[0]
                    const firstReservation = firstRental || firstPurchase || firstPrestation

                    // Collect unique tags across all sub-reservations
                    const allReservations = [
                      ...order.rental_reservations,
                      ...order.purchase_reservations,
                      ...order.prestation_reservations,
                    ]
                    const uniqueTags = Object.values(
                      allReservations
                        .flatMap((res) => res.tags || [])
                        .reduce<Record<number, Tag>>((acc, tag) => {
                          acc[tag.id] = tag
                          return acc
                        }, {})
                    )

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
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {uniqueTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {uniqueTags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                                  style={{
                                    backgroundColor: tag.color + '20',
                                    color: tag.color,
                                    borderColor: tag.color,
                                    borderWidth: '1px',
                                  }}
                                >
                                  {tag.name.length > 20 ? tag.name.slice(0, 20) + '…' : tag.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
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
