'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation, Tag, ItemOption } from '@/lib/supabase'
import { getSelectedOptionsFromDB, getInstallationFeesFromDB, type ReservationItemOptions } from '@/lib/reservation-utils'
import Loader from '@/components/Loader'
import ReservationTagSelector from '@/components/ReservationTagSelector'

interface ProductInfo {
  name: string
  slug: string
  images: string[]
  price: number
  new_price?: number
  category?: string
  subcategory?: string
}

interface RentalItem {
  id: number
  rental_reservation_id: number
  product_id: number
  quantity: number
  rental_start: string
  rental_end: string
  options: ReservationItemOptions | null
  personalizations: { [key: string]: string } | null
  needs_installation: boolean
  products: ProductInfo
}

interface PurchaseItem {
  id: number
  purchase_reservation_id: number
  product_id: number
  quantity: number
  estimated_delivery_date?: string
  options: ReservationItemOptions | null
  personalizations: { [key: string]: string } | null
  needs_installation: boolean
  products: ProductInfo
}

interface PrestationItem {
  id: number
  prestation_reservation_id: number
  product_id: number
  nb_of_people: number
  prestation_start?: string
  prestation_end?: string
  // Options can be either {selectedOptions: [...]} (new format) or a raw array (old format)
  options: ReservationItemOptions | ItemOption[] | null
  personalizations: { [key: string]: string } | null
  needs_installation: boolean
  products: ProductInfo
}

interface RentalReservationWithItems extends RentalReservation {
  items: RentalItem[]
  tags?: Tag[]
}

interface PurchaseReservationWithItems extends PurchaseReservation {
  items: PurchaseItem[]
  tags?: Tag[]
}

interface PrestationReservationWithItems extends PrestationReservation {
  items: PrestationItem[]
  tags?: Tag[]
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [modalAmount, setModalAmount] = useState('')
  const [modalConfirmOrder, setModalConfirmOrder] = useState(false)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedNotes, setSavedNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saved'>('idle')
  const [showDatesModal, setShowDatesModal] = useState(false)
  const [dateEdits, setDateEdits] = useState<Record<string, string>>({})
  const [isSubmittingDates, setIsSubmittingDates] = useState(false)
  const [notifyCustomer, setNotifyCustomer] = useState(false)
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({})
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  useEffect(() => {
    if (id) {
      loadOrderDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setNotes(result.order.notes || '')
      setSavedNotes(result.order.notes || '')
    } catch (err) {
      console.error('Erreur:', err)
      setError('Impossible de charger les détails de la commande')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setNotesStatus('idle')
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      setSavedNotes(notes)
      setNotesStatus('saved')
      setTimeout(() => setNotesStatus('idle'), 2000)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la sauvegarde des notes')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handlePaymentModalSubmit = async () => {
    const amount = parseFloat(modalAmount)
    if (modalAmount !== '' && (isNaN(amount) || amount < 0)) {
      alert('Veuillez entrer un montant valide')
      return
    }

    const amountChanged = modalAmount !== '' && amount !== data?.order.already_paid
    if (!amountChanged && !modalConfirmOrder) {
      alert('Aucune modification à enregistrer')
      return
    }

    setIsSubmittingModal(true)
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(amountChanged ? { amount_paid: amount } : {}),
          ...(modalConfirmOrder ? { confirm_order: true } : {}),
        })
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      await loadOrderDetail()
      setShowPaymentModal(false)
      setModalAmount('')
      setModalConfirmOrder(false)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la mise à jour')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  const toDateInputValue = (dateString: string) => {
    return dateString ? dateString.slice(0, 10) : ''
  }

  const toDatetimeLocalValue = (dateString: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const openDatesModal = () => {
    if (!data) return
    const edits: Record<string, string> = {}

    data.rental_reservations.flatMap(r => r.items).forEach(item => {
      edits[`rental_${item.id}_start`] = toDateInputValue(item.rental_start)
      edits[`rental_${item.id}_end`] = toDateInputValue(item.rental_end)
    })

    data.purchase_reservations.flatMap(p => p.items).forEach(item => {
      edits[`purchase_${item.id}_date`] = item.estimated_delivery_date ? toDateInputValue(item.estimated_delivery_date) : ''
    })

    data.prestation_reservations.flatMap(p => p.items).forEach(item => {
      edits[`prestation_${item.id}_start`] = item.prestation_start ? toDatetimeLocalValue(item.prestation_start) : ''
      edits[`prestation_${item.id}_end`] = item.prestation_end ? toDatetimeLocalValue(item.prestation_end) : ''
    })

    setDateEdits(edits)
    setDateErrors({})
    setNotifyCustomer(false)
    setShowDatesModal(true)
  }

  const handleDatesSubmit = async () => {
    if (!data) return
    setIsSubmittingDates(true)

    interface DateUpdate {
      table: string
      id: number
      rental_start?: string
      rental_end?: string
      estimated_delivery_date?: string
      prestation_start?: string
      prestation_end?: string
    }

    const updates: DateUpdate[] = []

    data.rental_reservations.flatMap(r => r.items).forEach(item => {
      const start = dateEdits[`rental_${item.id}_start`]
      const end = dateEdits[`rental_${item.id}_end`]
      const origStart = toDateInputValue(item.rental_start)
      const origEnd = toDateInputValue(item.rental_end)

      if (start !== origStart || end !== origEnd) {
        updates.push({
          table: 'rental_items',
          id: item.id,
          rental_start: start,
          rental_end: end,
        })
      }
    })

    data.purchase_reservations.flatMap(p => p.items).forEach(item => {
      const date = dateEdits[`purchase_${item.id}_date`]
      const origDate = item.estimated_delivery_date ? toDateInputValue(item.estimated_delivery_date) : ''

      if (date !== origDate) {
        updates.push({
          table: 'purchase_items',
          id: item.id,
          estimated_delivery_date: date || undefined,
        })
      }
    })

    data.prestation_reservations.flatMap(p => p.items).forEach(item => {
      const start = dateEdits[`prestation_${item.id}_start`]
      const end = dateEdits[`prestation_${item.id}_end`]
      const origStart = item.prestation_start ? toDatetimeLocalValue(item.prestation_start) : ''
      const origEnd = item.prestation_end ? toDatetimeLocalValue(item.prestation_end) : ''

      if (start !== origStart || end !== origEnd) {
        updates.push({
          table: 'prestation_items',
          id: item.id,
          prestation_start: start ? new Date(start).toISOString() : undefined,
          prestation_end: end ? new Date(end).toISOString() : undefined,
        })
      }
    })

    if (updates.length === 0) {
      setShowDatesModal(false)
      setIsSubmittingDates(false)
      return
    }

    try {
      // Vérifier la disponibilité avant de mettre à jour
      const checkResponse = await fetch('/api/admin/items/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (checkResponse.status === 401) {
        router.push('/admin/login')
        return
      }

      const checkResult = await checkResponse.json()

      if (!checkResult.available) {
        const newErrors: Record<string, string> = {}
        for (const err of checkResult.errors as { item_id: number; table: string; message: string }[]) {
          const prefix = err.table === 'rental_items' ? 'rental' : 'prestation'
          newErrors[`${prefix}_${err.item_id}`] = err.message
        }
        setDateErrors(newErrors)
        setIsSubmittingDates(false)
        return
      }

      setDateErrors({})

      const response = await fetch('/api/admin/items/update-dates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, notify_customer: notifyCustomer, order_id: id })
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des dates')
      }

      await loadOrderDetail()
      setShowDatesModal(false)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de la mise à jour des dates')
    } finally {
      setIsSubmittingDates(false)
    }
  }

  const handleResendConfirmation = async () => {
    setIsSendingEmail(true)
    setEmailStatus('idle')
    try {
      const response = await fetch(`/api/admin/reservations/${id}/resend-confirmation`, {
        method: 'POST',
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'envoi')
      }

      setEmailStatus('success')
      setTimeout(() => setEmailStatus('idle'), 3000)
    } catch (err) {
      console.error('Erreur:', err)
      setEmailStatus('error')
      setTimeout(() => setEmailStatus('idle'), 3000)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: 'CANCELLED' })
      })

      if (response.status === 401) {
        router.push('/admin/login')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'annulation')
      }

      await loadOrderDetail()
      setShowCancelModal(false)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'annulation de la commande')
    } finally {
      setIsCancelling(false)
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
    const selectedOptions = getSelectedOptionsFromDB(item.options)
    const optionsFees = selectedOptions.reduce((sum: number, opt) => sum + opt.additional_fee, 0)
    const installationFees = item.needs_installation ? getInstallationFeesFromDB(item.options) : 0
    // Use nb_of_people for prestation items, quantity for others
    const multiplier = 'nb_of_people' in item ? item.nb_of_people : item.quantity
    return (basePrice + optionsFees + installationFees) * multiplier
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
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800 border-green-200', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      PENDING: { label: 'En attente de paiement', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800 border-red-200', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
      DONE: { label: 'Terminée', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: null }

    return (
      <span className={`rounded-lg font-medium border ${config.color} p-2 md:px-4 md:py-2 flex items-center gap-1.5`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">{config.icon}</svg>
        <span className="hidden md:inline text-sm">{config.label}</span>
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
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            title="Retour au dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
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
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                title="Retour"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-black tracking-wide">{order.order_number}</h1>
                <p className="text-sm text-stone-600">Créée le {formatDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {firstReservation && getStatusBadge(firstReservation.reservation_status)}
              <button
                onClick={openDatesModal}
                className="p-2 md:px-4 md:py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                title="Modifier les dates"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden xl:inline">Modifier les dates</span>
              </button>
              <button
                onClick={() => {
                  setModalAmount(order.already_paid > 0 ? order.already_paid.toString() : '')
                  setShowPaymentModal(true)
                }}
                className="p-2 md:px-4 md:py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                title="Enregistrer un paiement"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden xl:inline">Enregistrer un paiement</span>
              </button>
              <button
                onClick={handleResendConfirmation}
                disabled={isSendingEmail}
                className={`p-2 md:px-4 md:py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  emailStatus === 'success'
                    ? 'bg-green-600 text-white'
                    : emailStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-800 hover:bg-stone-900 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Renvoyer l'email de confirmation"
              >
                {isSendingEmail ? (
                  <svg className="h-5 w-5 lg:h-4 lg:w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : emailStatus === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : emailStatus === 'error' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="hidden xl:inline">
                  {isSendingEmail ? 'Envoi...' : emailStatus === 'success' ? 'Email envoyé' : emailStatus === 'error' ? 'Erreur' : 'Renvoyer l\'email'}
                </span>
              </button>
              {firstReservation && firstReservation.reservation_status !== 'CANCELLED' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="p-2 md:px-4 md:py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Annuler la commande"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 xl:h-4 xl:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden xl:inline">Annuler</span>
                </button>
              )}
            </div>
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

              <h3 className="text-lg font-semibold text-black mb-4">Notes</h3>
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setNotesStatus('idle')
                  }}
                  placeholder="Ajouter une note sur cette commande..."
                  rows={3}
                  className="w-full text-sm text-black border border-stone-300 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder:text-stone-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || notes === savedNotes}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingNotes ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  {notesStatus === 'saved' && (
                    <span className="text-sm text-green-600 font-medium">Enregistré</span>
                  )}
                </div>
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
                    {firstRental && (
                      <div className="pt-2">
                        <p className="text-xs text-stone-500 mb-2">Tags :</p>
                        <ReservationTagSelector
                          reservationId={firstRental.id}
                          reservationType="rental"
                          currentTags={firstRental.tags || []}
                          onTagsChange={(tags) => {
                            setData(prev => {
                              if (!prev) return null
                              return {
                                ...prev,
                                rental_reservations: prev.rental_reservations.map(r =>
                                  r.id === firstRental.id ? { ...r, tags } : r
                                )
                              }
                            })
                          }}
                        />
                      </div>
                    )}
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
                    {firstPurchase && (
                      <div className="pt-2">
                        <p className="text-xs text-stone-500 mb-2">Tags :</p>
                        <ReservationTagSelector
                          reservationId={firstPurchase.id}
                          reservationType="purchase"
                          currentTags={firstPurchase.tags || []}
                          onTagsChange={(tags) => {
                            setData(prev => {
                              if (!prev) return null
                              return {
                                ...prev,
                                purchase_reservations: prev.purchase_reservations.map(p =>
                                  p.id === firstPurchase.id ? { ...p, tags } : p
                                )
                              }
                            })
                          }}
                        />
                      </div>
                    )}
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
                      <span className="text-sm font-semibold text-purple-700">
                        {prestation_reservations.reduce((sum, pr) => sum + (pr.delivery_fees ?? 0), 0).toFixed(2)} €
                      </span>
                    </div>
                    {prestation_reservations.map((prestaRes) => (
                      <div key={prestaRes.id} className="pt-2">
                        <p className="text-xs text-stone-500 mb-2">
                          Tags{prestation_reservations.length > 1 ? ` (${prestaRes.delivery_address ? 'À domicile' : 'En boutique'})` : ''} :
                        </p>
                        <ReservationTagSelector
                          reservationId={prestaRes.id}
                          reservationType="prestation"
                          currentTags={prestaRes.tags || []}
                          onTagsChange={(tags) => {
                            setData(prev => {
                              if (!prev) return null
                              return {
                                ...prev,
                                prestation_reservations: prev.prestation_reservations.map(p =>
                                  p.id === prestaRes.id ? { ...p, tags } : p
                                )
                              }
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Total général */}
                <div className="flex justify-between pt-3 border-t-2 border-stone-300">
                  <span className="text-sm font-bold text-stone-900">MONTANT TOTAL</span>
                  <span className="text-sm font-bold text-black">{order.total_price.toFixed(2)} €</span>
                </div>

                {/* Déjà payé & Reste à payer */}
                <div className="pt-4 space-y-2 border-t border-stone-200">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-600">Déjà payé</span>
                    <span className={`text-sm font-semibold ${order.already_paid > 0 ? 'text-green-600' : 'text-stone-400'}`}>
                      {order.already_paid.toFixed(2)} €
                    </span>
                  </div>
                  {(order.total_price - order.already_paid) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Reste à payer</span>
                      <span className="text-sm font-semibold text-amber-600">
                        {(order.total_price - order.already_paid).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>

                {/* Caution */}
                {firstRental?.caution && firstRental.caution > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">⚠️ Caution</span>
                      <span className="text-sm font-semibold text-amber-600">{firstRental.caution.toFixed(2)} €</span>
                    </div>
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
                    {hasPrestations && prestation_reservations.map((prestaRes) => (
                      <div key={prestaRes.id} className="border-l-4 border-purple-500 pl-3">
                        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">
                          {prestation_reservations.length > 1
                            ? `Prestations (${prestaRes.delivery_address ? 'À domicile' : 'En boutique'})`
                            : 'Prestations'}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Lieu</p>
                            <p className="text-sm text-black">
                              {prestaRes.delivery_address ? '🏠 À domicile' : '🏪 En boutique'}
                            </p>
                          </div>
                          {prestaRes.delivery_address && (
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Adresse</p>
                              <p className="text-sm text-black">{prestaRes.delivery_address}</p>
                            </div>
                          )}
                          {(prestaRes.delivery_fees ?? 0) > 0 && (
                            <div>
                              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Frais de déplacement</p>
                              <p className="text-sm text-black">{(prestaRes.delivery_fees ?? 0).toFixed(2)} €</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <Image
                                src={item.products.images[0]}
                                alt={item.products.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black break-words">{item.products.name}</h3>
                            {item.products.category && item.products.subcategory && (
                              <p className="text-xs text-stone-400 mb-2">{item.products.category} → {item.products.subcategory}</p>
                            )}

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
                              {getSelectedOptionsFromDB(item.options).length > 0 && (
                                <div className="space-y-1">
                                  {getSelectedOptionsFromDB(item.options).map((option, idx) => (
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
                                  <span className="font-medium">Installation :</span> +{getInstallationFeesFromDB(item.options).toFixed(2)}€
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
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <Image
                                src={item.products.images[0]}
                                alt={item.products.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black break-words">{item.products.name}</h3>
                            {item.products.category && item.products.subcategory && (
                              <p className="text-xs text-stone-400 mb-2">{item.products.category} → {item.products.subcategory}</p>
                            )}

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
                              {getSelectedOptionsFromDB(item.options).length > 0 && (
                                <div className="space-y-1">
                                  {getSelectedOptionsFromDB(item.options).map((option, idx) => (
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
                                  <span className="font-medium">Installation :</span> +{getInstallationFeesFromDB(item.options).toFixed(2)}€
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
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                              <Image
                                src={item.products.images[0]}
                                alt={item.products.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          )}

                          {/* Détails produit */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base md:text-lg text-black break-words">{item.products.name}</h3>
                            {item.products.category && item.products.subcategory && (
                              <p className="text-xs text-stone-400 mb-2">{item.products.category} → {item.products.subcategory}</p>
                            )}

                            <div className="space-y-1 text-sm text-stone-700">
                              {item.prestation_start && item.prestation_end && (
                                <>
                                  <p>
                                    <span className="font-medium">Date :</span> {formatDateOnly(item.prestation_start)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Horaire :</span>{' '}
                                    {new Date(item.prestation_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {new Date(item.prestation_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </>
                              )}
                              <p>
                                <span className="font-medium">Prix unitaire :</span> {(item.products.new_price ?? item.products.price).toFixed(2)} €
                              </p>

                              {/* Options sélectionnées */}
                              {getSelectedOptionsFromDB(item.options).length > 0 && (
                                <div className="space-y-1">
                                  {getSelectedOptionsFromDB(item.options).map((option, idx) => (
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
                                <span className="font-medium">Nombre de personnes :</span> {item.nb_of_people}
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

      {/* Modale de paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">Enregistrer un paiement</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setModalAmount('')
                  setModalConfirmOrder(false)
                }}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(() => {
              const newAlreadyPaid = parseFloat(modalAmount) || 0
              const previewRemaining = Math.max(0, order.total_price - newAlreadyPaid)

              return (
                <div className="space-y-5">
                  {/* Résumé financier */}
                  <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Montant total</span>
                      <span className="font-semibold text-black">{order.total_price.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Déjà payé</span>
                      <span className={`font-semibold ${newAlreadyPaid > 0 ? 'text-green-600' : 'text-stone-400'}`}>
                        {newAlreadyPaid.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-stone-200 pt-2">
                      <span className="text-stone-600 font-medium">Reste à payer</span>
                      <span className={`font-bold ${previewRemaining === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        {previewRemaining.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Montant payé */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Montant total déjà payé par le client
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={order.total_price}
                        step="0.01"
                        value={modalAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (e.target.value === '' || isNaN(val)) {
                            setModalAmount(e.target.value)
                            return
                          }
                          if (val > order.total_price) {
                            setModalAmount(order.total_price.toFixed(2))
                          } else {
                            setModalAmount(e.target.value)
                          }
                        }}
                        placeholder="0.00"
                        className="w-full border border-stone-300 rounded-lg px-4 py-3 text-black text-lg font-medium focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder:text-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">€</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">Maximum : {order.total_price.toFixed(2)} €</p>
                  </div>

                  {/* Toggle confirmer la réservation */}
                  <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-stone-900">Confirmer la réservation</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalConfirmOrder(!modalConfirmOrder)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        modalConfirmOrder ? 'bg-green-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          modalConfirmOrder ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowPaymentModal(false)
                        setModalAmount('')
                        setModalConfirmOrder(false)
                      }}
                      className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePaymentModalSubmit}
                      disabled={isSubmittingModal || (!modalAmount && !modalConfirmOrder)}
                      className="flex-1 px-4 py-3 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingModal ? 'Enregistrement...' : 'Valider'}
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modale de modification des dates */}
      {showDatesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">Modifier les dates</h3>
              <button
                onClick={() => setShowDatesModal(false)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {Object.keys(dateErrors).length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Certaines dates ne sont pas disponibles</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Locations */}
              {rentalItems.length > 0 && (
                <div className="border-l-4 border-blue-500 pl-4 space-y-4">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Locations</p>
                  {rentalItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <p className="text-sm font-medium text-black">{item.products.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Début</label>
                          <input
                            type="date"
                            value={dateEdits[`rental_${item.id}_start`] || ''}
                            onChange={(e) => {
                              const newStart = e.target.value
                              setDateEdits(prev => {
                                const oldStart = prev[`rental_${item.id}_start`]
                                const oldEnd = prev[`rental_${item.id}_end`]
                                const next: Record<string, string> = { ...prev, [`rental_${item.id}_start`]: newStart }
                                if (oldStart && oldEnd) {
                                  const diffMs = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
                                  const newEnd = new Date(new Date(newStart).getTime() + diffMs)
                                  const pad = (n: number) => n.toString().padStart(2, '0')
                                  next[`rental_${item.id}_end`] = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())}`
                                }
                                return next
                              })
                              setDateErrors(prev => { const next = { ...prev }; delete next[`rental_${item.id}`]; return next })
                            }}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Fin</label>
                          <input
                            type="date"
                            value={dateEdits[`rental_${item.id}_end`] || ''}
                            onChange={(e) => {
                              setDateEdits(prev => ({ ...prev, [`rental_${item.id}_end`]: e.target.value }))
                              setDateErrors(prev => { const next = { ...prev }; delete next[`rental_${item.id}`]; return next })
                            }}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                      {dateErrors[`rental_${item.id}`] && (
                        <p className="text-xs text-red-600 mt-1">{dateErrors[`rental_${item.id}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Achats */}
              {purchaseItems.length > 0 && (
                <div className="border-l-4 border-green-500 pl-4 space-y-4">
                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Achats</p>
                  {purchaseItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <p className="text-sm font-medium text-black">{item.products.name}</p>
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">Date de livraison estimée</label>
                        <input
                          type="date"
                          value={dateEdits[`purchase_${item.id}_date`] || ''}
                          onChange={(e) => setDateEdits(prev => ({ ...prev, [`purchase_${item.id}_date`]: e.target.value }))}
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prestations */}
              {prestationItems.length > 0 && (
                <div className="border-l-4 border-purple-500 pl-4 space-y-4">
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide">Prestations</p>
                  {prestationItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <p className="text-sm font-medium text-black">{item.products.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Début</label>
                          <input
                            type="datetime-local"
                            value={dateEdits[`prestation_${item.id}_start`] || ''}
                            onChange={(e) => {
                              const newStart = e.target.value
                              setDateEdits(prev => {
                                const oldStart = prev[`prestation_${item.id}_start`]
                                const oldEnd = prev[`prestation_${item.id}_end`]
                                const next: Record<string, string> = { ...prev, [`prestation_${item.id}_start`]: newStart }
                                if (oldStart && oldEnd) {
                                  const diffMs = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
                                  const newEnd = new Date(new Date(newStart).getTime() + diffMs)
                                  const pad = (n: number) => n.toString().padStart(2, '0')
                                  next[`prestation_${item.id}_end`] = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())}T${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`
                                }
                                return next
                              })
                              setDateErrors(prev => { const next = { ...prev }; delete next[`prestation_${item.id}`]; return next })
                            }}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Fin</label>
                          <input
                            type="datetime-local"
                            value={dateEdits[`prestation_${item.id}_end`] || ''}
                            onChange={(e) => {
                              setDateEdits(prev => ({ ...prev, [`prestation_${item.id}_end`]: e.target.value }))
                              setDateErrors(prev => { const next = { ...prev }; delete next[`prestation_${item.id}`]; return next })
                            }}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </div>
                      {dateErrors[`prestation_${item.id}`] && (
                        <p className="text-xs text-red-600 mt-1">{dateErrors[`prestation_${item.id}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle notifier le client */}
            <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl mt-6">
              <div>
                <p className="text-sm font-medium text-stone-900">Notifier le client</p>
                <p className="text-xs text-stone-500">Envoyer un email avec la confirmation mise à jour</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyCustomer(!notifyCustomer)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifyCustomer ? 'bg-green-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifyCustomer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowDatesModal(false)}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDatesSubmit}
                disabled={isSubmittingDates}
                className="flex-1 px-4 py-3 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingDates ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation d'annulation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">Annuler la commande</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-stone-600 mb-6">
              Cette action va libérer la disponibilité des produits concernés.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Annulation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
