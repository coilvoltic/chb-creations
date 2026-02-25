'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAllPrestationUnavailabilities, getBoutiqueSettings, PrestationUnavailableSlot } from '@/lib/supabase'
import type { BoutiqueTimeSlot, BoutiqueHoursDefault, BoutiqueHoursException } from '@/types'

// Convertit "HH:MM" en minutes depuis minuit
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Génère les créneaux de 5 min couvrant tous les slots de la journée
function generateTimeOptions(slots: BoutiqueTimeSlot[]): string[] {
  if (slots.length === 0) return []
  const options: string[] = []
  const seen = new Set<string>()

  // Trier les slots par heure de début avant de générer
  const sorted = [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))

  for (const slot of sorted) {
    const startMin = timeToMinutes(slot.start)
    const endMin = timeToMinutes(slot.end)
    for (let min = startMin; min < endMin; min += 5) {
      const h = Math.floor(min / 60)
      const m = min % 60
      const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      if (!seen.has(label)) {
        seen.add(label)
        options.push(label)
      }
    }
  }

  return options
}

// Vérifie si une heure "HH:MM" est dans au moins un des slots autorisés
function isTimeInSlots(time: string, slots: BoutiqueTimeSlot[]): boolean {
  const min = timeToMinutes(time)
  return slots.some(slot => {
    const start = timeToMinutes(slot.start)
    const end = timeToMinutes(slot.end)
    return min >= start && min < end
  })
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
  const [isLoading, setIsLoading] = useState(true)
  const [localTime, setLocalTime] = useState(selectedTime || '14:00')

  // Boutique settings
  const [boutiqueDefaultHours, setBoutiqueDefaultHours] = useState<BoutiqueHoursDefault>({
    slots: [{ start: '08:00', end: '20:00' }],
  })
  const [boutiqueExceptions, setBoutiqueExceptions] = useState<BoutiqueHoursException[]>([])

  // Sync local time with parent
  useEffect(() => {
    if (selectedTime) setLocalTime(selectedTime)
  }, [selectedTime])

  // Initialize time when date is first selected
  useEffect(() => {
    if (selectedDate && !selectedTime) {
      setLocalTime('14:00')
      onTimeChange('14:00')
    }
  }, [selectedDate, selectedTime, onTimeChange])

  // Charger les deux sources en parallèle
  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true)
      const [slots, { defaultHours, exceptions }] = await Promise.all([
        getAllPrestationUnavailabilities(),
        getBoutiqueSettings(),
      ])
      setUnavailableSlots(slots)
      setBoutiqueDefaultHours(defaultHours)
      setBoutiqueExceptions(exceptions)
      setIsLoading(false)
    }
    fetchAll()
  }, [])

  // Calcule les slots effectifs pour la date sélectionnée (null = fermé)
  const effectiveSlots = useMemo((): BoutiqueTimeSlot[] | null => {
    if (!selectedDate) return boutiqueDefaultHours.slots

    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    const exception = boutiqueExceptions.find((e) => e.date === dateStr)
    if (!exception) return boutiqueDefaultHours.slots
    if (exception.closed) return null
    return exception.slots ?? boutiqueDefaultHours.slots
  }, [selectedDate, boutiqueDefaultHours, boutiqueExceptions])

  const isClosed = effectiveSlots === null

  // Génère les options du select selon les slots effectifs
  const timeOptions = useMemo(() => {
    if (!effectiveSlots) return []
    return generateTimeOptions(effectiveSlots)
  }, [effectiveSlots])

  // Combine les indisponibilités DB + panier
  const allUnavailableSlots = useMemo(() => [...unavailableSlots, ...cartUnavailabilities], [unavailableSlots, cartUnavailabilities])

  // Calcule les heures bloquées (conflit avec une réservation existante)
  const blockedTimes = useMemo(() => {
    if (!selectedDate) return new Set<string>()
    const blocked = new Set<string>()

    for (const time of timeOptions) {
      const [hours, minutes] = time.split(':').map(Number)
      const startDT = new Date(selectedDate)
      startDT.setHours(hours, minutes, 0, 0)
      const endDT = new Date(startDT)
      endDT.setMinutes(endDT.getMinutes() + duration)

      const hasConflict = allUnavailableSlots.some((slot) => {
        const slotStart = new Date(slot.prestation_start)
        const slotEnd = new Date(slot.prestation_end)
        return startDT < slotEnd && endDT > slotStart
      })

      if (hasConflict) blocked.add(time)
    }
    return blocked
  }, [selectedDate, duration, allUnavailableSlots, timeOptions])

  // Quand la date change : repositionner sur la première heure dispo
  useEffect(() => {
    if (!selectedDate) return
    if (isClosed) {
      onConflictChange?.(true)
      return
    }
    if (!effectiveSlots || effectiveSlots.length === 0) return
    if (!isTimeInSlots(localTime, effectiveSlots) || blockedTimes.has(localTime)) {
      const firstAvailable = timeOptions.find((t) => !blockedTimes.has(t))
      if (firstAvailable) {
        setLocalTime(firstAvailable)
        onTimeChange(firstAvailable)
      }
    }
    onConflictChange?.(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, blockedTimes, isClosed])

  const handleTimeChange = (newTime: string) => {
    setLocalTime(newTime)
    onTimeChange(newTime)
  }

  // Calcule l'heure de fin affichée
  const calculateEndTime = () => {
    if (!selectedDate || !selectedTime) return null
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const startDT = new Date(selectedDate)
    startDT.setHours(hours, minutes, 0, 0)
    const endDT = new Date(startDT)
    endDT.setMinutes(endDT.getMinutes() + duration)
    return `${endDT.getHours().toString().padStart(2, '0')}:${endDT.getMinutes().toString().padStart(2, '0')}`
  }

  // Trouver le slot auquel appartient l'heure affichée (pour label de groupe)
  const getSlotLabel = (time: string): string | null => {
    if (!effectiveSlots) return null
    const slot = effectiveSlots.find(
      (s) => timeToMinutes(time) >= timeToMinutes(s.start) && timeToMinutes(time) < timeToMinutes(s.end)
    )
    return slot ? `${slot.start}–${slot.end}` : null
  }

  return (
    <div className="space-y-4">
      {!selectedDate && (
        <p className="text-sm text-stone-500 italic">Veuillez d&apos;abord sélectionner une date</p>
      )}

      {selectedDate && (
        <>
          {isClosed ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              La boutique est fermée ce jour-là. Veuillez choisir une autre date.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className={`text-sm font-semibold mb-4 ${disabled ? 'text-stone-400' : ''}`}>
                  Heure de début
                </h3>

                {/* Afficher les créneaux disponibles si plusieurs */}
                {effectiveSlots && effectiveSlots.length > 1 && (
                  <p className="text-xs text-stone-500">
                    Créneaux disponibles :{' '}
                    {effectiveSlots.map((s, i) => (
                      <span key={i}>
                        {i > 0 && ' • '}
                        <strong>{s.start}–{s.end}</strong>
                      </span>
                    ))}
                  </p>
                )}

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
                    {effectiveSlots && effectiveSlots.length > 1
                      ? // Grouper par créneau si plusieurs slots
                        effectiveSlots.map((slot) => {
                          const slotOptions = timeOptions.filter(
                            (t) =>
                              timeToMinutes(t) >= timeToMinutes(slot.start) &&
                              timeToMinutes(t) < timeToMinutes(slot.end)
                          )
                          if (slotOptions.length === 0) return null
                          return (
                            <optgroup key={`${slot.start}-${slot.end}`} label={`${slot.start} – ${slot.end}`}>
                              {slotOptions.map((time) => (
                                <option key={time} value={time} disabled={blockedTimes.has(time)}>
                                  {time}{blockedTimes.has(time) ? ' — indisponible' : ''}
                                </option>
                              ))}
                            </optgroup>
                          )
                        })
                      : // Un seul slot : liste plate
                        timeOptions.map((time) => (
                          <option key={time} value={time} disabled={blockedTimes.has(time)}>
                            {time}{blockedTimes.has(time) ? ' — indisponible' : ''}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {selectedTime && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm space-y-1">
                  <p className="text-stone-600">
                    <strong>Durée totale :</strong> {duration} minutes
                  </p>
                  <p className="text-stone-600">
                    <strong>Heure de fin :</strong> {calculateEndTime()}
                  </p>
                  {effectiveSlots && effectiveSlots.length > 1 && getSlotLabel(selectedTime) && (
                    <p className="text-stone-500 text-xs">
                      Créneau : {getSlotLabel(selectedTime)}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
