'use client'

import { useMemo, useState } from 'react'
import type { CustomerOrder, RentalReservation, PurchaseReservation, PrestationReservation } from '@/lib/supabase'

interface OrderWithReservations extends CustomerOrder {
  rental_reservations: RentalReservation[]
  purchase_reservations: PurchaseReservation[]
  prestation_reservations: PrestationReservation[]
}

interface ReservationCalendarProps {
  orders: OrderWithReservations[]
  onOrderClick: (orderId: number) => void
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  orders: OrderWithReservations[]
}

export default function ReservationCalendar({ orders, onOrderClick }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const { calendarDays, monthYear } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Premier jour du mois
    const firstDay = new Date(year, month, 1)
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0)

    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    const firstDayOfWeek = firstDay.getDay()
    // Ajuster pour que lundi soit le premier jour (0)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    // Créer le calendrier
    const days: CalendarDay[] = []

    // Ajouter les jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        orders: getOrdersForDate(date, orders)
      })
    }

    // Ajouter les jours du mois actuel
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        isCurrentMonth: true,
        orders: getOrdersForDate(date, orders)
      })
    }

    // Ajouter les jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length // 6 semaines x 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        orders: getOrdersForDate(date, orders)
      })
    }

    return {
      calendarDays: days,
      monthYear: firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
  }, [currentDate, orders])

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      {/* En-tête du calendrier */}
      <div className="p-4 md:p-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold text-black capitalize">
          {monthYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={previousMonth}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            title="Mois précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            title="Mois suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="p-2 md:p-4">
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div key={day} className="text-center text-xs md:text-sm font-medium text-stone-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
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
  const hasOrders = day.orders.length > 0

  return (
    <div
      className={`
        min-h-[80px] md:min-h-[100px] p-1 md:p-2 border rounded-lg
        ${day.isCurrentMonth ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-100'}
        ${isToday ? 'ring-2 ring-black' : ''}
      `}
    >
      <div className={`text-xs md:text-sm font-medium mb-1 ${day.isCurrentMonth ? 'text-black' : 'text-stone-400'}`}>
        {day.date.getDate()}
      </div>

      {hasOrders && (
        <div className="space-y-1">
          {day.orders.slice(0, 3).map((order) => {
            // Récupérer la première réservation pour le statut
            const firstReservation =
              order.rental_reservations[0] ||
              order.purchase_reservations[0] ||
              order.prestation_reservations[0]

            const statusColor = getStatusColor(firstReservation?.reservation_status)

            return (
              <button
                key={order.id}
                onClick={() => onOrderClick(order.id)}
                className={`
                  w-full text-left px-1 md:px-2 py-0.5 md:py-1 rounded text-xs
                  ${statusColor}
                  hover:opacity-80 transition-opacity
                `}
                title={`${order.order_number} - ${order.customer_infos.firstName} ${order.customer_infos.lastName}`}
              >
                <div className="truncate font-medium">
                  {order.order_number}
                </div>
                <div className="truncate text-xs opacity-90">
                  {order.customer_infos.firstName}
                </div>
              </button>
            )
          })}
          {day.orders.length > 3 && (
            <div className="text-xs text-stone-500 text-center">
              +{day.orders.length - 3} autre{day.orders.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Fonction pour récupérer les commandes d'une date spécifique
function getOrdersForDate(date: Date, orders: OrderWithReservations[]): OrderWithReservations[] {
  const dateStr = date.toISOString().split('T')[0]

  return orders.filter(order => {
    // Vérifier les locations (rental_reservations)
    const hasRentalOnDate = order.rental_reservations.some(rental =>
      rental.rental_items?.some(item => {
        if (!item.rental_start || !item.rental_end) return false
        const startDate = new Date(item.rental_start).toISOString().split('T')[0]
        const endDate = new Date(item.rental_end).toISOString().split('T')[0]
        return dateStr >= startDate && dateStr <= endDate
      })
    )

    // Vérifier les prestations (prestation_reservations)
    const hasPrestationOnDate = order.prestation_reservations.some(prestation =>
      prestation.prestation_items?.some(item => {
        if (!item.prestation_date) return false
        const prestationDate = new Date(item.prestation_date).toISOString().split('T')[0]
        return dateStr === prestationDate
      })
    )

    // Vérifier les achats (purchase_reservations) - utiliser la date de livraison estimée
    const hasPurchaseOnDate = order.purchase_reservations.some(purchase =>
      purchase.purchase_items?.some(item => {
        if (!item.estimated_delivery_date) return false
        const deliveryDate = new Date(item.estimated_delivery_date).toISOString().split('T')[0]
        return dateStr === deliveryDate
      })
    )

    return hasRentalOnDate || hasPrestationOnDate || hasPurchaseOnDate
  })
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

// Obtenir la couleur selon le statut
function getStatusColor(status?: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800'
    case 'CONFIRMED_NO_DEPOSIT':
      return 'bg-blue-100 text-blue-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    case 'DONE':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-stone-100 text-stone-800'
  }
}
