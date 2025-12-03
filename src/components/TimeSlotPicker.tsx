'use client'

import { TimeSlot, TIME_SLOT_LABELS, TIME_SLOTS } from '@/lib/supabase'

interface TimeSlotPickerProps {
  selectedSlot?: TimeSlot
  onSlotChange: (slot: TimeSlot) => void
  disabled?: boolean
  unavailableSlots?: TimeSlot[] // Créneaux déjà réservés
}

export default function TimeSlotPicker({
  selectedSlot,
  onSlotChange,
  disabled = false,
  unavailableSlots = [],
}: TimeSlotPickerProps) {
  return (
    <div className="space-y-3">
      {TIME_SLOTS.map((slot) => {
        const isSelected = selectedSlot === slot
        const isUnavailable = unavailableSlots.includes(slot)
        const isDisabled = disabled || isUnavailable

        return (
          <label
            key={slot}
            className={`flex items-center p-4 border-2 rounded-lg transition-all ${
              isSelected
                ? 'border-black bg-stone-50'
                : isUnavailable
                ? 'border-red-200 bg-red-50'
                : 'border-stone-200 hover:border-stone-300'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name="timeSlot"
              value={slot}
              checked={isSelected}
              onChange={() => {
                if (!isDisabled) {
                  onSlotChange(slot)
                }
              }}
              disabled={isDisabled}
              className="mr-3 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isUnavailable ? 'text-red-600' : 'text-black'}`}>
                  {TIME_SLOT_LABELS[slot]}
                </span>
                {isUnavailable && (
                  <span className="text-xs text-red-600 ml-2">Indisponible</span>
                )}
              </div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
