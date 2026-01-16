'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation } from '@/lib/supabase'
import { TIME_SLOT_LABELS } from '@/lib/supabase'
import Loader from '@/components/Loader'

interface RentalItem {
  id: number
  rental_reservation_id: number
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
    price: number
    new_price?: number
  }
}

interface PurchaseItem {
  id: number
  purchase_reservation_id: number
  product_id: number
  quantity: number
  estimated_delivery_date?: string
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
    price: number
    new_price?: number
  }
}

interface PrestationItem {
  id: number
  prestation_reservation_id: number
  product_id: number
  quantity: number
  prestation_date?: string // Date only (YYYY-MM-DD)
  time_slot?: 'LUNCH' | 'AFTERNOON' | 'EVENING' // Fixed time slot ENUM
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
    price: number
    new_price?: number
  }
}

interface RentalReservationWithItems extends RentalReservation {
  items: RentalItem[]
}

interface PurchaseReservationWithItems extends PurchaseReservation {
  items: PurchaseItem[]
}

interface PrestationReservationWithItems extends PrestationReservation {
  items: PrestationItem[]
}

interface OrderDetail {
  order: CustomerOrder
  rental_reservations: RentalReservationWithItems[]
  purchase_reservations: PurchaseReservationWithItems[]
  prestation_reservations: PrestationReservationWithItems[]
}

export default function ReservationDetailPage() {
  const [data, setData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  useEffect(() => {
    if (id) {
      loadOrderDetail()
    }
  }, [id])

  const loadOrderDetail = async () => {
    try {
      const response = await fetch(`/api/admin/reservations/${id}`)

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la commande')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les détails de la commande')
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

  const calculateItemPrice = (item: RentalItem | PurchaseItem | PrestationItem) => {
    const basePrice = item.products.new_price ?? item.products.price
    const optionsFees = item.options?.selectedOptions?.reduce((sum, opt) => sum + opt.additional_fee, 0) ?? 0
    const installationFees = item.options?.installationFees ?? 0
    return (basePrice + optionsFees + installationFees) * item.quantity
  }

  const calculateRentalTotal = () => {
    return rentalItems.reduce((sum, item) => sum + calculateItemPrice(item), 0)
  }

  const calculatePurchaseTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + calculateItemPrice(item), 0)
  }

  const calculatePrestationTotal = () => {
    return prestationItems.reduce((sum, item) => sum + calculateItemPrice(item), 0)
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
    return <Loader />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Commande non trouvée'}</p>
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

  const { order, rental_reservations, purchase_reservations, prestation_reservations } = data
  // Get first reservation (rental, purchase or prestation) for display
  const firstRental = rental_reservations[0]
  const firstPurchase = purchase_reservations[0]
  const firstPrestation = prestation_reservations[0]
  const firstReservation = firstRental || firstPurchase || firstPrestation

  // Combine all items from all types
  const rentalItems = rental_reservations.flatMap(r => r.items)
  const purchaseItems = purchase_reservations.flatMap(p => p.items)
  const prestationItems = prestation_reservations.flatMap(p => p.items)
  const hasRentals = rentalItems.length > 0
  const hasPurchases = purchaseItems.length > 0
  const hasPrestations = prestationItems.length > 0

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
                <h1 className="text-xl md:text-2xl font-bold text-black tracking-wide">Réservation n° {order.order_number}</h1>
                <p className="text-sm text-stone-600">Créée le {formatDate(order.created_at)}</p>
              </div>
            </div>
            {firstReservation && getStatusBadge(firstReservation.reservation_status)}
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
                    {order.customer_infos.firstName} {order.customer_infos.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-black">{order.customer_infos.email}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Téléphone</p>
                  <p className="text-sm text-black">{order.customer_infos.phone}</p>
                </div>
                {order.promotional_code_name && order.promotional_code_discount && (
                  <div className="pt-3 border-t border-stone-200">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Code promo</p>
                    <p className="text-sm font-medium text-green-700">
                      {order.promotional_code_name} (-{order.promotional_code_discount}%)
                    </p>
                  </div>
                )}
              </div>

              <hr className="my-6 border-stone-200" />

              <h3 className="text-lg font-semibold text-black mb-4">Détails financiers</h3>
              <div className="space-y-4">
                {/* Section LOCATIONS */}
                {hasRentals && (
                  <div className="border-l-4 border-blue-500 pl-3 space-y-2">
                    <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">Locations</p>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Sous-total</span>
                      <span className="text-sm font-semibold text-blue-700">{calculateRentalTotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Frais de livraison</span>
                      <span className="text-sm font-semibold text-blue-700">{(firstRental?.delivery_fees ?? 0).toFixed(2)} €</span>
                    </div>
                  </div>
                )}

                {/* Section ACHATS */}
                {hasPurchases && (
                  <div className="border-l-4 border-green-500 pl-3 space-y-2">
                    <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-2">Achats</p>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Sous-total</span>
                      <span className="text-sm font-semibold text-green-700">{calculatePurchaseTotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Frais de livraison</span>
                      <span className="text-sm font-semibold text-green-700">{(firstPurchase?.delivery_fees ?? 0).toFixed(2)} €</span>
                    </div>
                  </div>
                )}

                {/* Section PRESTATIONS */}
                {hasPrestations && (
                  <div className="border-l-4 border-purple-500 pl-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">Prestations</p>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Sous-total</span>
                      <span className="text-sm font-semibold text-purple-700">{calculatePrestationTotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Frais de déplacement</span>
                      <span className="text-sm font-semibold text-purple-700">{(firstPrestation?.delivery_fees ?? 0).toFixed(2)} €</span>
                    </div>
                  </div>
                )}

                {/* Total général */}
                <div className="flex justify-between pt-3 border-t-2 border-stone-300">
                  <span className="text-sm font-bold text-stone-900">MONTANT TOTAL</span>
                  <span className="text-sm font-bold text-black">{order.total_price.toFixed(2)} €</span>
                </div>

                {/* Section globale Acompte & Caution */}
                {(firstRental?.deposit || firstRental?.caution) && (
                  <div className="pt-4 space-y-2 border-t border-stone-200">
                    {firstRental.deposit && firstRental.deposit > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">💳 Acompte</span>
                        <span className="text-sm font-semibold text-blue-600">{firstRental.deposit.toFixed(2)} €</span>
                      </div>
                    )}
                    {firstRental.caution && firstRental.caution > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">⚠️ Caution</span>
                        <span className="text-sm font-semibold text-amber-600">{firstRental.caution.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(hasRentals || hasPurchases || hasPrestations) && (
                <>
                  <hr className="my-6 border-stone-200" />

                  <h3 className="text-lg font-semibold text-black mb-4">Livraison</h3>
                  <div className="space-y-4">
                    {/* Livraison Locations */}
                    {hasRentals && firstRental && (
                      <div className="border-l-4 border-blue-500 pl-3">
                        <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">Locations</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Option</p>
                            <p className="text-sm text-black">
                              {firstRental.delivery_address ? '🚚 Livraison' : '🏪 Retrait en boutique'}
                            </p>
                          </div>
                          {firstRental.delivery_address && (
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Adresse</p>
                              <p className="text-sm text-black">{firstRental.delivery_address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Livraison Achats */}
                    {hasPurchases && firstPurchase && (
                      <div className="border-l-4 border-green-500 pl-3">
                        <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-2">Achats</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Option</p>
                            <p className="text-sm text-black">
                              {firstPurchase.delivery_address ? '🚚 Livraison' : '🏪 Retrait en boutique'}
                            </p>
                          </div>
                          {firstPurchase.delivery_address && (
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Adresse</p>
                              <p className="text-sm text-black">{firstPurchase.delivery_address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Livraison Prestations */}
                    {hasPrestations && firstPrestation && (
                      <div className="border-l-4 border-purple-500 pl-3">
                        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">Prestations</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Lieu</p>
                            <p className="text-sm text-black">
                              {firstPrestation.delivery_address ? '🏠 À domicile' : '🏪 En boutique'}
                            </p>
                          </div>
                          {firstPrestation.delivery_address && (
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Adresse</p>
                              <p className="text-sm text-black">{firstPrestation.delivery_address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Articles de la réservation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section LOCATIONS */}
            {hasRentals && (
              <div className="border-1 border-blue-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-blue-900">Locations</h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {rentalItems.length} article{rentalItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {rentalItems.map((item: RentalItem, index: number) => (
                    <div key={item.id}>
                      <div className="py-4 first:pt-0">
                        <div className="flex gap-4">
                          {/* Image produit */}
                          {item.products.images && item.products.images.length > 0 && (
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black mb-2 break-words">{item.products.name}</h3>

                            <div className="space-y-1 text-sm text-stone-700">
                              <p>
                                <span className="font-medium">Période :</span>{' '}
                                <span className="inline-block">{formatDateOnly(item.rental_start)}</span>
                                {' → '}
                                <span className="inline-block">{formatDateOnly(item.rental_end)}</span>
                              </p>
                              <p>
                                <span className="font-medium">Prix unitaire :</span> {(item.products.new_price ?? item.products.price).toFixed(2)} €
                              </p>

                              {/* Options sélectionnées */}
                              {item.options?.selectedOptions && item.options.selectedOptions.length > 0 && (
                                <div className="space-y-1">
                                  {item.options.selectedOptions.map((option, idx) => (
                                    <p key={idx} className="text-blue-700 break-words">
                                      <span className="font-medium">{option.option_type_name} :</span> {option.name}
                                      {option.additional_fee > 0 && ` (+${option.additional_fee.toFixed(2)} €)`}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Personnalisations */}
                              {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {Object.entries(item.personalizations).map(([fieldName, value], idx) => (
                                    <p key={idx} className="text-stone-700 break-words">
                                      <span className="font-medium">✏️ {fieldName} :</span> {value}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Installation */}
                              {item.needs_installation && (
                                <p className="text-green-700">
                                  <span className="font-medium">Installation :</span> +{(item.options?.installationFees ?? 0).toFixed(2)}€
                                </p>
                              )}

                              <p>
                                <span className="font-medium">Quantité :</span> {item.quantity}
                              </p>
                            </div>

                            {/* Subtotal */}
                            <div className="mt-3 text-right">
                              <p className="text-base md:text-lg font-bold">
                                {calculateItemPrice(item).toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Separator line */}
                      {index < rentalItems.length - 1 && (
                        <div className="border-b border-stone-200 mt-4"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section ACHATS */}
            {hasPurchases && (
              <div className="border-1 border-green-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-green-900">Achats</h2>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {purchaseItems.length} article{purchaseItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {purchaseItems.map((item: PurchaseItem, index: number) => (
                    <div key={item.id}>
                      <div className="py-4 first:pt-0">
                        <div className="flex gap-4">
                          {/* Image produit */}
                          {item.products.images && item.products.images.length > 0 && (
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black mb-2 break-words">{item.products.name}</h3>

                            <div className="space-y-1 text-sm text-stone-700">
                              {item.estimated_delivery_date && (
                                <p>
                                  <span className="font-medium">Date de livraison estimée :</span> {formatDateOnly(item.estimated_delivery_date)}
                                </p>
                              )}
                              <p>
                                <span className="font-medium">Prix unitaire :</span> {(item.products.new_price ?? item.products.price).toFixed(2)} €
                              </p>

                              {/* Options sélectionnées */}
                              {item.options?.selectedOptions && item.options.selectedOptions.length > 0 && (
                                <div className="space-y-1">
                                  {item.options.selectedOptions.map((option, idx) => (
                                    <p key={idx} className="text-green-700 break-words">
                                      <span className="font-medium">{option.option_type_name} :</span> {option.name}
                                      {option.additional_fee > 0 && ` (+${option.additional_fee.toFixed(2)} €)`}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Personnalisations */}
                              {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {Object.entries(item.personalizations).map(([fieldName, value], idx) => (
                                    <p key={idx} className="text-stone-700 break-words">
                                      <span className="font-medium">✏️ {fieldName} :</span> {value}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Installation */}
                              {item.needs_installation && (
                                <p className="text-green-700">
                                  <span className="font-medium">Installation :</span> +{(item.options?.installationFees ?? 0).toFixed(2)}€
                                </p>
                              )}

                              <p>
                                <span className="font-medium">Quantité :</span> {item.quantity}
                              </p>
                            </div>

                            {/* Subtotal */}
                            <div className="mt-3 text-right">
                              <p className="text-base md:text-lg font-bold">
                                {calculateItemPrice(item).toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Separator line */}
                      {index < purchaseItems.length - 1 && (
                        <div className="border-b border-stone-200 mt-4"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section PRESTATIONS */}
            {hasPrestations && (
              <div className="border-1 border-purple-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-purple-900">Prestations</h2>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {prestationItems.length} prestation{prestationItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {prestationItems.map((item: PrestationItem, index: number) => (
                    <div key={item.id}>
                      <div className="py-4 first:pt-0">
                        <div className="flex gap-4">
                          {/* Image produit */}
                          {item.products.images && item.products.images.length > 0 && (
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black mb-2 break-words">{item.products.name}</h3>

                            <div className="space-y-1 text-sm text-stone-700">
                              {item.prestation_date && (
                                <p>
                                  <span className="font-medium">Date :</span> {formatDateOnly(item.prestation_date)}
                                </p>
                              )}
                              {item.time_slot && (
                                <p>
                                  <span className="font-medium">Créneau :</span> {TIME_SLOT_LABELS[item.time_slot]}
                                </p>
                              )}
                              <p>
                                <span className="font-medium">Prix unitaire :</span> {(item.products.new_price ?? item.products.price).toFixed(2)} €
                              </p>

                              {/* Options sélectionnées */}
                              {item.options?.selectedOptions && item.options.selectedOptions.length > 0 && (
                                <div className="space-y-1">
                                  {item.options.selectedOptions.map((option, idx) => (
                                    <p key={idx} className="text-purple-700 break-words">
                                      <span className="font-medium">{option.option_type_name} :</span> {option.name}
                                      {option.additional_fee > 0 && ` (+${option.additional_fee.toFixed(2)} €)`}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Personnalisations */}
                              {item.personalizations && Object.keys(item.personalizations).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {Object.entries(item.personalizations).map(([fieldName, value], idx) => (
                                    <p key={idx} className="text-stone-700 break-words">
                                      <span className="font-medium">✏️ {fieldName} :</span> {value}
                                    </p>
                                  ))}
                                </div>
                              )}

                              <p>
                                <span className="font-medium">Quantité :</span> {item.quantity}
                              </p>
                            </div>

                            {/* Subtotal */}
                            <div className="mt-3 text-right">
                              <p className="text-base md:text-lg font-bold">
                                {calculateItemPrice(item).toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Separator line */}
                      {index < prestationItems.length - 1 && (
                        <div className="border-b border-stone-200 mt-4"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
