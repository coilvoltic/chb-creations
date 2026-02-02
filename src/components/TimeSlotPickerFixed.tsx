'use client'

import { useState, useEffect } from 'react'
import { getAllPrestationUnavailabilities, PrestationUnavailableSlot } from '@/lib/supabase'
import { AlertCircle } from 'lucide-react'

interface TimeSlotPickerFixedProps {
  selectedDate: Date | null
  selectedSlot: 'LUNCH' | 'AFTERNOON' | 'EVENING' | null
  onSlotChange: (slot: 'LUNCH' | 'AFTERNOON' | 'EVENING') => void
  disabled?: boolean
}

// Définition des créneaux fixes
const TIME_SLOTS = [
  {
    id: 'LUNCH' as const,
    time: '12h00 - 15h30',
    startHour: 12,
    startMinute: 0,
    durationMinutes: 210, // 3h30
  },
  {
    id: 'AFTERNOON' as const,
    time: '16h00 - 20h00',
    startHour: 16,
    startMinute: 0,
    durationMinutes: 240, // 4h
  },
  {
    id: 'EVENING' as const,
    time: '20h30 - 23h30',
    startHour: 20,
    startMinute: 30,
    durationMinutes: 180, // 3h
  },
]

export default function TimeSlotPickerFixed({
  selectedDate,
  selectedSlot,
  onSlotChange,
  disabled = false,
}: TimeSlotPickerFixedProps) {
  const [unavailableSlots, setUnavailableSlots] = useState<PrestationUnavailableSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conflictingSlots, setConflictingSlots] = useState<Set<string>>(new Set())

  // Charger les créneaux indisponibles
  useEffect(() => {
    async function fetchUnavailabilities() {
      setIsLoading(true)
      const slots = await getAllPrestationUnavailabilities()
      setUnavailableSlots(slots)
      setIsLoading(false)
    }
    fetchUnavailabilities()
  }, [])

  // Vérifier les chevauchements pour chaque créneau
  useEffect(() => {
    if (!selectedDate || unavailableSlots.length === 0) {
      setConflictingSlots(new Set())
      return
    }

    const conflicts = new Set<string>()

    TIME_SLOTS.forEach((slot) => {
      const slotStart = new Date(selectedDate)
      slotStart.setHours(slot.startHour, slot.startMinute, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + slot.durationMinutes)

      // Vérifier si ce créneau chevauche avec une réservation existante
      const hasConflict = unavailableSlots.some((unavailable) => {
        const unavailableStart = new Date(unavailable.prestation_start)
        const unavailableEnd = new Date(unavailable.prestation_end)

        // Détection de chevauchement
        return slotStart < unavailableEnd && slotEnd > unavailableStart
      })

      if (hasConflict) {
        conflicts.add(slot.id)
      }
    })

    setConflictingSlots(conflicts)
  }, [selectedDate, unavailableSlots])

  return (
    <div className="space-y-3">
      {/* Message si aucune date sélectionnée */}
      {!selectedDate && (
        <p className="text-sm text-stone-500 italic">Veuillez d&apos;abord sélectionner une date</p>
      )}

      {selectedDate && (
        <>
          {TIME_SLOTS.map((slot) => {
            const isConflicting = conflictingSlots.has(slot.id)
            const isSelected = selectedSlot === slot.id
            const isDisabled = disabled || isLoading || isConflicting

            return (
              <label
                key={slot.id}
                className={`flex items-center p-4 border-2 rounded-lg transition-all ${
                  isSelected
                    ? 'border-black bg-stone-50'
                    : isConflicting
                    ? 'border-red-200 bg-red-50'
                    : 'border-stone-200 hover:border-stone-300'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="timeSlot"
                  value={slot.id}
                  checked={isSelected}
                  onChange={() => {
                    if (!isDisabled) {
                      onSlotChange(slot.id)
                    }
                  }}
                  disabled={isDisabled}
                  className="mr-3 flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isConflicting ? 'text-red-600' : 'text-black'}`}>
                      {slot.time}
                    </span>
                    {isConflicting && (
                      <span className="text-xs text-red-600 ml-2">Indisponible</span>
                    )}
                  </div>
                </div>
              </label>
            )
          })}
        </>
      )}
    </div>
  )
}

// Export helper function to convert slot to start/end times
export function getSlotTimes(slot: 'LUNCH' | 'AFTERNOON' | 'EVENING', date: Date): { start: Date; end: Date } {
  const slotConfig = TIME_SLOTS.find((s) => s.id === slot)
  if (!slotConfig) {
    throw new Error(`Invalid slot: ${slot}`)
  }

  const start = new Date(date)
  start.setHours(slotConfig.startHour, slotConfig.startMinute, 0, 0)

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + slotConfig.durationMinutes)

  return { start, end }
}
