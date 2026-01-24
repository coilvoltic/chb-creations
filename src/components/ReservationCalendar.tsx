'use client'

import { useMemo, useState } from 'react'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation, RentalItem, PurchaseItem, PrestationItem } from '@/lib/supabase'

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
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  events: CalendarEvent[]
}

export default function ReservationCalendar({ orders, onOrderClick }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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
      days.push({
        date,
        isCurrentMonth: true,
        events: getEventsForDate(date, orders)
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
  }, [currentDate, orders])

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      {/* En-tête du calendrier */}
      <div className="p-4 md:p-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

      {/* Vue par semaine */}
      <div className="p-4 md:p-6">
        {/* Jours de la semaine - Colonne verticale sur mobile/tablette, grille sur grand écran */}
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-7 xl:gap-4">
          {calendarDays.map((day, index) => (
            <CalendarDayCell
              key={index}
              day={day}
              onOrderClick={onOrderClick}
              isToday={isToday(day.date)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface CalendarDayCellProps {
  day: CalendarDay
  onOrderClick: (orderId: number) => void
  isToday: boolean
}

function CalendarDayCell({ day, onOrderClick, isToday }: CalendarDayCellProps) {
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
}

function EventCard({ event, onClick }: EventCardProps) {
  const categoryColor = getCategoryColor(event.reservationType)
  const icon = getEventIcon(event.type)
  const paymentBadge = getPaymentStatusBadge(event.status)

  return (
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
          <div className="flex items-center gap-1.5">
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
        </div>
      </div>
    </button>
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

// Fonction pour récupérer les événements d'une date spécifique
function getEventsForDate(date: Date, orders: OrderWithReservations[]): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0]
  const events: CalendarEvent[] = []

  orders.forEach(order => {
    const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`

    // Traiter les locations (rental_reservations)
    order.rental_reservations.forEach(rental => {
      rental.rental_items?.forEach(item => {
        if (!item.rental_start || !item.rental_end) return

        const startDateTime = new Date(item.rental_start)
        const endDateTime = new Date(item.rental_end)
        const startDate = startDateTime.toISOString().split('T')[0]
        const endDate = endDateTime.toISOString().split('T')[0]

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
            time: startTime
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
            time: endTime
          })
        }
      })
    })

    // Traiter les prestations (prestation_reservations)
    order.prestation_reservations.forEach(prestation => {
      prestation.prestation_items?.forEach(item => {
        if (!item.prestation_date) return

        const prestationDate = new Date(item.prestation_date).toISOString().split('T')[0]

        if (dateStr === prestationDate) {
          // Convertir le time_slot en plage horaire
          const timeSlotLabel = getTimeSlotLabel(item.time_slot)

          events.push({
            type: 'prestation',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: prestation.id,
            reservationType: 'prestation',
            status: prestation.reservation_status,
            time: timeSlotLabel
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
        const deliveryDateStr = deliveryDate.toISOString().split('T')[0]

        if (dateStr === deliveryDateStr) {
          events.push({
            type: 'purchase_delivery',
            orderId: order.id,
            orderNumber: order.order_number,
            customerName,
            reservationId: purchase.id,
            reservationType: 'purchase',
            status: purchase.reservation_status
            // Pas d'heure pour les achats
          })
        }
      }
    })
  })

  return events
}

// Convertir le time_slot enum en label lisible
function getTimeSlotLabel(timeSlot?: string): string {
  switch (timeSlot) {
    case 'LUNCH':
      return '12h-15h30'
    case 'AFTERNOON':
      return '16h-20h'
    case 'EVENING':
      return '20h30-23h30'
    default:
      return ''
  }
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
