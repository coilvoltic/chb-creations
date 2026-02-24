'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAllPrestationUnavailabilities, PrestationUnavailableSlot } from '@/lib/supabase'

// Génère les créneaux de 08:00 à 20:00 toutes les 5 minutes
function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 20 && m > 0) break
      options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }
  return options
}

interface TimePickerBoutiqueProps {
  selectedDate: Date | null
  selectedTime: string | null // Format HH:MM (ex: "14:30")
  duration: number // Durée en minutes (ex: 60, 90, 120)
  onTimeChange: (time: string) => void
  onConflictChange?: (hasConflict: boolean) => void
  disabled?: boolean
  cartUnavailabilities?: PrestationUnavailableSlot[]
}

export default function TimePickerBoutique({
  selectedDate,
  selectedTime,
  duration,
  onTimeChange,
  onConflictChange,
  disabled = false,
  cartUnavailabilities = [],
}: TimePickerBoutiqueProps) {
  const [unavailableSlots, setUnavailableSlots] = useState<PrestationUnavailableSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [localTime, setLocalTime] = useState(selectedTime || '14:00')
  const timeOptions = useMemo(() => generateTimeOptions(), [])

  // Sync local time with parent when selectedTime changes
  useEffect(() => {
    if (selectedTime) {
      setLocalTime(selectedTime)
    }
  }, [selectedTime])

  // Initialize time when date is first selected (if no time set yet)
  useEffect(() => {
    if (selectedDate && !selectedTime) {
      const defaultTime = '14:00'
      setLocalTime(defaultTime)
      onTimeChange(defaultTime)
    }
  }, [selectedDate, selectedTime, onTimeChange])

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

  // Combine database unavailabilities with cart unavailabilities
  const allUnavailableSlots = [...unavailableSlots, ...cartUnavailabilities]

  // Calcule l'ensemble des heures bloquées pour la date sélectionnée
  const blockedTimes = useMemo(() => {
    if (!selectedDate) return new Set<string>()

    const blocked = new Set<string>()
    for (const time of timeOptions) {
      const [hours, minutes] = time.split(':').map(Number)
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(hours, minutes, 0, 0)
      const endDateTime = new Date(startDateTime)
      endDateTime.setMinutes(endDateTime.getMinutes() + duration)

      const hasConflict = allUnavailableSlots.some((slot) => {
        const slotStart = new Date(slot.prestation_start)
        const slotEnd = new Date(slot.prestation_end)
        return startDateTime < slotEnd && endDateTime > slotStart
      })

      if (hasConflict) blocked.add(time)
    }
    return blocked
  }, [selectedDate, duration, allUnavailableSlots, timeOptions])

  // Quand la date change, si l'heure sélectionnée est bloquée, passer à la première dispo
  useEffect(() => {
    if (!selectedDate) return
    if (blockedTimes.has(localTime)) {
      const firstAvailable = timeOptions.find((t) => !blockedTimes.has(t))
      if (firstAvailable) {
        setLocalTime(firstAvailable)
        onTimeChange(firstAvailable)
      }
    }
    onConflictChange?.(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, blockedTimes])

  const handleTimeChange = (newTime: string) => {
    setLocalTime(newTime)
    onTimeChange(newTime)
  }

  // Calculer l'heure de fin
  const calculateEndTime = () => {
    if (!selectedDate || !selectedTime) return null
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(hours, minutes, 0, 0)
    const endDateTime = new Date(startDateTime)
    endDateTime.setMinutes(endDateTime.getMinutes() + duration)
    return `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Message si aucune date sélectionnée */}
      {!selectedDate && (
        <p className="text-sm text-stone-500 italic">Veuillez d&apos;abord sélectionner une date</p>
      )}

      {selectedDate && (
        <>
          {/* Sélection de l'heure */}
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold mb-4 ${disabled ? 'text-stone-400' : ''}`}>
              Heure de début
            </h3>

            <div className="min-w-0 overflow-hidden">
              <label htmlFor="prestation-time" className={`block text-xs mb-2 ${disabled ? 'text-stone-400' : 'text-stone-600'}`}>
                Heure de début
              </label>
              <select
                id="prestation-time"
                value={localTime}
                disabled={disabled || isLoading}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full max-w-full px-2 md:px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time} disabled={blockedTimes.has(time)}>
                    {time}{blockedTimes.has(time) ? ' — indisponible' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Affichage de la durée et de l'heure de fin */}
          {selectedTime && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm space-y-1">
              <p className="text-stone-600">
                <strong>Durée totale :</strong> {duration} minutes
              </p>
              <p className="text-stone-600">
                <strong>Heure de fin :</strong> {calculateEndTime()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
