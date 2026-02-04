'use client'

import { useMemo, useState, useEffect } from 'react'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation, RentalItem, PurchaseItem, PrestationItem, Tag } from '@/lib/supabase'
import QuickTagModal from './QuickTagModal'

// Extended interfaces to include nested items
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

interface ReservationCalendarProps {
  orders: OrderWithReservations[]
  onOrderClick: (orderId: number) => void
}

// Types d'événements pour le calendrier
type CalendarEventType = 'rental_pickup' | 'rental_return' | 'prestation' | 'purchase_delivery'

interface CalendarEvent {
  type: CalendarEventType
  orderId: number
  orderNumber: string
  customerName: string
  reservationId: number
  reservationType: 'rental' | 'purchase' | 'prestation'
  status: string
  time?: string // Heure pour les prestations et locations
  tags?: Tag[] // Tags associés à la réservation
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  events: CalendarEvent[]
}

export default function ReservationCalendar({ orders, onOrderClick }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [ordersState, setOrdersState] = useState(orders)
  const [tagModalState, setTagModalState] = useState<{
    isOpen: boolean
    reservationId: number | null
    reservationType: 'rental' | 'purchase' | 'prestation' | null
    currentTags: Tag[]
  }>({
    isOpen: false,
    reservationId: null,
    reservationType: null,
    currentTags: []
  })

  // Synchroniser ordersState avec props orders
  useEffect(() => {
    setOrdersState(orders)
  }, [orders])

  // Charger tous les tags disponibles
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/admin/tags')
        if (response.ok) {
          const data = await response.json()
          setAllTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      }
    }
    fetchTags()
  }, [])

  const openTagModal = (reservationId: number, reservationType: 'rental' | 'purchase' | 'prestation', currentTags: Tag[]) => {
    setTagModalState({
      isOpen: true,
      reservationId,
      reservationType,
      currentTags
    })
  }

  const closeTagModal = () => {
    setTagModalState({
      isOpen: false,
      reservationId: null,
      reservationType: null,
      currentTags: []
    })
  }

  const handleTagsChange = (newTags: Tag[]) => {
    if (!tagModalState.reservationId || !tagModalState.reservationType) return

    // Mettre à jour l'état local
    setOrdersState(prevOrders => {
      return prevOrders.map(order => {
        if (tagModalState.reservationType === 'rental') {
          return {
            ...order,
            rental_reservations: order.rental_reservations.map(r =>
              r.id === tagModalState.reservationId ? { ...r, tags: newTags } : r
            )
          }
        } else if (tagModalState.reservationType === 'purchase') {
          return {
            ...order,
            purchase_reservations: order.purchase_reservations.map(p =>
              p.id === tagModalState.reservationId ? { ...p, tags: newTags } : p
            )
          }
        } else if (tagModalState.reservationType === 'prestation') {
          return {
            ...order,
            prestation_reservations: order.prestation_reservations.map(p =>
              p.id === tagModalState.reservationId ? { ...p, tags: newTags } : p
            )
          }
        }
        return order
      })
    })

    // Mettre à jour l'état du modal
    setTagModalState(prev => ({ ...prev, currentTags: newTags }))
  }

  const { calendarDays, weekRange } = useMemo(() => {
    // Calculer le début de la semaine (lundi)
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = day === 0 ? -6 : 1 - day // Ajuster pour que lundi soit le premier jour
    startOfWeek.setDate(startOfWeek.getDate() + diff)
    startOfWeek.setHours(0, 0, 0, 0)

    // Créer les 7 jours de la semaine
    const days: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const allEvents = getEventsForDate(date, ordersState)

      // Filtrer les événements par tags si des tags sont sélectionnés
      const filteredEvents = selectedTagIds.length > 0
        ? allEvents.filter(event =>
            event.tags && event.tags.some(tag => selectedTagIds.includes(tag.id))
          )
        : allEvents

      days.push({
        date,
        isCurrentMonth: true,
        events: filteredEvents
      })
    }

    // Calculer la fin de la semaine (dimanche)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const weekRange = `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

    return {
      calendarDays: days,
      weekRange
    }
  }, [currentDate, ordersState, selectedTagIds])

  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const clearFilters = () => {
    setSelectedTagIds([])
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      {/* En-tête du calendrier */}
      <div className="p-4 md:p-6 border-b border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-black capitalize">
            {weekRange}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={previousWeek}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
              title="Semaine précédente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextWeek}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
              title="Semaine suivante"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtres par tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-stone-600">Filtrer par tags :</span>
            {allTags.map(tag => (
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
                  ...(selectedTagIds.includes(tag.id) && {
                    ringColor: tag.color
                  })
                }}
              >
                {tag.name}
              </button>
            ))}
            {selectedTagIds.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-stone-500 hover:text-stone-700 underline ml-2"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vue par semaine */}
      <div className="p-4 md:p-6">
        {/* Jours de la semaine - Colonne verticale sur mobile/tablette, grille sur grand écran */}
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-7 xl:gap-4">
          {calendarDays.map((day, index) => (
            <CalendarDayCell
              key={index}
              day={day}
              onOrderClick={onOrderClick}
              onTagClick={openTagModal}
              isToday={isToday(day.date)}
            />
          ))}
        </div>
      </div>

      {/* Modal de gestion des tags */}
      <QuickTagModal
        isOpen={tagModalState.isOpen}
        onClose={closeTagModal}
        reservationId={tagModalState.reservationId || 0}
        reservationType={tagModalState.reservationType || 'rental'}
        currentTags={tagModalState.currentTags}
        onTagsChange={handleTagsChange}
      />
    </div>
  )
}

interface CalendarDayCellProps {
  day: CalendarDay
  onOrderClick: (orderId: number) => void
  onTagClick: (reservationId: number, reservationType: 'rental' | 'purchase' | 'prestation', currentTags: Tag[]) => void
  isToday: boolean
}

function CalendarDayCell({ day, onOrderClick, onTagClick, isToday }: CalendarDayCellProps) {
  const hasEvents = day.events.length > 0
  const dayName = day.date.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dayNumber = day.date.getDate()
  const monthName = day.date.toLocaleDateString('fr-FR', { month: 'short' })

  // Trier les événements par heure (ceux avec heure en premier, puis par ordre chronologique)
  const sortedEvents = [...day.events].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  return (
    <div
      className={`
        p-3 border rounded-xl
        bg-white border-stone-200
        xl:min-h-[400px]
        ${isToday ? 'ring-2 ring-black' : ''}
      `}
    >
      {/* En-tête du jour */}
      <div className="mb-3 pb-2 border-b border-stone-200">
        <div className="text-xs text-stone-500 uppercase font-medium">
          {dayName}
        </div>
        <div className="text-2xl font-bold text-black">
          {dayNumber} {monthName}
        </div>
      </div>

      {/* Événements */}
      {hasEvents ? (
        <div className="space-y-2">
          {sortedEvents.map((event, index) => (
            <EventCard
              key={`${event.orderId}-${event.reservationId}-${event.type}-${index}`}
              event={event}
              onClick={() => onOrderClick(event.orderId)}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-stone-400 italic">
          Aucun événement
        </div>
      )}
    </div>
  )
}

// Composant pour afficher une carte d'événement détaillée
interface EventCardProps {
  event: CalendarEvent
  onClick: () => void
  onTagClick: (reservationId: number, reservationType: 'rental' | 'purchase' | 'prestation', currentTags: Tag[]) => void
}

function EventCard({ event, onClick, onTagClick }: EventCardProps) {
  const categoryColor = getCategoryColor(event.reservationType)
  const icon = getEventIcon(event.type)
  const paymentBadge = getPaymentStatusBadge(event.status)

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher l'ouverture de la commande
    onTagClick(event.reservationId, event.reservationType, event.tags || [])
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          w-full text-left p-2 rounded-lg border-l-4
          ${categoryColor}
          hover:shadow-md transition-shadow
        `}
      >
        <div className="flex items-start gap-2">
          {/* Icône */}
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="text-xs font-semibold text-stone-900 truncate">
                #{event.orderNumber}
              </div>
              {paymentBadge}
            </div>
            <div className="text-xs text-stone-700 truncate">
              {event.customerName}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {getEventLabel(event.type)}
            </div>
            {event.time && (
              <div className="text-xs font-medium text-stone-600 mt-1">
                {event.time}
              </div>
            )}
            {/* Tags personnalisés */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {event.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      borderColor: tag.color,
                      borderWidth: '1px'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Bouton + pour gérer les tags */}
      <button
        onClick={handleTagClick}
        className="absolute top-1 right-1 w-6 h-6 bg-white border border-stone-300 rounded-md shadow-sm hover:bg-stone-50 hover:border-stone-400 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
        title="Gérer les tags"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// Obtenir le badge de statut de paiement
function getPaymentStatusBadge(status: string) {
  if (status === 'CONFIRMED' || status === 'DONE') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 whitespace-nowrap">
        Payé
      </span>
    )
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
        En attente
      </span>
    )
  }
  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 whitespace-nowrap">
        Annulé
      </span>
    )
  }
  return null
}

// Obtenir l'icône selon le type d'événement
function getEventIcon(type: CalendarEventType) {
  switch (type) {
    case 'rental_pickup':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    case 'rental_return':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    case 'prestation':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'purchase_delivery':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
  }
}

// Labels pour les types d'événements
function getEventLabel(type: CalendarEventType): string {
  switch (type) {
    case 'rental_pickup':
      return 'Récupération location'
    case 'rental_return':
      return 'Restitution location'
    case 'prestation':
      return 'Prestation henné'
    case 'purchase_delivery':
      return 'Livraison achat estimée'
    default:
      return ''
  }
}

// Helper function to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Fonction pour récupérer les événements d'une date spécifique
function getEventsForDate(date: Date, orders: OrderWithReservations[]): CalendarEvent[] {
  const dateStr = formatDateLocal(date)
  const events: CalendarEvent[] = []

  orders.forEach(order => {
    const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`

    // Traiter les locations (rental_reservations)
    order.rental_reservations.forEach(rental => {
      rental.rental_items?.forEach(item => {
        if (!item.rental_start || !item.rental_end) return

        const startDateTime = new Date(item.rental_start)
        const endDateTime = new Date(item.rental_end)
        const startDate = formatDateLocal(startDateTime)
        const endDate = formatDateLocal(endDateTime)

        // Extraire l'heure au format HH:MM
        const startTime = startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        const endTime = endDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

        // Ajouter événement de récupération
        if (dateStr === startDate) {
          events.push({
            type: 'rental_pickup',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: rental.id,
            reservationType: 'rental',
            status: rental.reservation_status,
            time: startTime,
            tags: rental.tags || []
          })
        }

        // Ajouter événement de restitution
        if (dateStr === endDate) {
          events.push({
            type: 'rental_return',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: rental.id,
            reservationType: 'rental',
            status: rental.reservation_status,
            time: endTime,
            tags: rental.tags || []
          })
        }
      })
    })

    // Traiter les prestations (prestation_reservations)
    order.prestation_reservations.forEach(prestation => {
      prestation.prestation_items?.forEach(item => {
        if (!item.prestation_start || !item.prestation_end) return

        const prestationStartDateTime = new Date(item.prestation_start)
        const prestationEndDateTime = new Date(item.prestation_end)
        const prestationDate = formatDateLocal(prestationStartDateTime)

        if (dateStr === prestationDate) {
          // Extraire l'heure de début et de fin
          const startTime = prestationStartDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const endTime = prestationEndDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const timeLabel = `${startTime} - ${endTime}`

          events.push({
            type: 'prestation',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: prestation.id,
            reservationType: 'prestation',
            status: prestation.reservation_status,
            time: timeLabel,
            tags: prestation.tags || []
          })
        }
      })
    })

    // Traiter les achats (purchase_reservations) - t+5j depuis la création de la commande
    order.purchase_reservations.forEach(purchase => {
      if (purchase.purchase_items && purchase.purchase_items.length > 0) {
        // Calculer t+5j depuis la date de création de la commande
        const orderCreatedDate = new Date(order.created_at)
        const deliveryDate = new Date(orderCreatedDate)
        deliveryDate.setDate(deliveryDate.getDate() + 5)
        const deliveryDateStr = formatDateLocal(deliveryDate)

        if (dateStr === deliveryDateStr) {
          events.push({
            type: 'purchase_delivery',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: purchase.id,
            reservationType: 'purchase',
            status: purchase.reservation_status,
            tags: purchase.tags || []
            // Pas d'heure pour les achats
          })
        }
      }
    })
  })

  return events
}

// Vérifier si une date est aujourd'hui
function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Obtenir la couleur selon la catégorie de réservation
function getCategoryColor(reservationType: 'rental' | 'purchase' | 'prestation'): string {
  switch (reservationType) {
    case 'rental':
      return 'bg-blue-50 border-blue-500 hover:bg-blue-100'
    case 'purchase':
      return 'bg-green-50 border-green-500 hover:bg-green-100'
    case 'prestation':
      return 'bg-purple-50 border-purple-500 hover:bg-purple-100'
    default:
      return 'bg-stone-50 border-stone-500 hover:bg-stone-100'
  }
}
