'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Reservation } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      const response = await fetch('/api/admin/reservations')

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des réservations')
      }

      const data = await response.json()
      setReservations(data.reservations || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les réservations')
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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-stone-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1 md:mb-2">Administration</h1>
              <p className="text-sm text-stone-600 font-satisfy">CHB Créations<span className="text-sm text-stone-600 font-sans"> - Gestion des réservations</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
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

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-200">
            <h2 className="text-xl font-semibold text-black">
              Réservations ({reservations.length})
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              Triées par date de création (plus récentes en premier)
            </p>
          </div>

          {reservations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-500">Aucune réservation pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                      ID
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
                      Acompte
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
                  {reservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="hover:bg-stone-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/reservations/${reservation.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                        #{reservation.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-black">
                          {reservation.customer_infos.firstName} {reservation.customer_infos.lastName}
                        </div>
                        <div className="text-xs text-stone-500">{reservation.customer_infos.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                        {formatDate(reservation.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-black">
                        {reservation.total_price.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                        {(reservation.deposit ?? 0).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(reservation.reservation_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/reservations/${reservation.id}`)
                          }}
                          className="text-black hover:text-stone-600 font-medium"
                        >
                          Voir détails →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
