'use client'

import { DayPicker } from 'react-day-picker'
import { fr } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { useState } from 'react'

interface PrestationDatePickerProps {
  selectedDate: Date | null
  selectedTime: string
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  minDate?: Date
  disabled?: boolean
}

export default function PrestationDatePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  minDate,
  disabled = false,
}: PrestationDatePickerProps) {
  const [localTime, setLocalTime] = useState(selectedTime || '14:00')

  // Disable past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !disabled) {
      onDateChange(date)
    }
  }

  const handleTimeChange = (value: string) => {
    // Prevent empty values
    if (!value) return

    setLocalTime(value)
    onTimeChange(value)
  }

  return (
    <div className={`border border-stone-200 rounded-xl p-4 overflow-hidden ${disabled ? 'bg-stone-50 opacity-60' : 'bg-white'}`}>
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={disabled ? undefined : handleDateSelect}
        disabled={disabled ? true : [{ before: minDate || today }]}
        locale={fr}
        className="rdp-custom"
        classNames={{
          day_button: 'rdp-day-button',
          selected: 'rdp-selected',
          disabled: 'rdp-disabled',
        }}
      />

      {/* Time selection - show only when date is selected */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-stone-200 overflow-hidden">
          <h3 className={`text-sm font-semibold mb-4 ${disabled ? 'text-stone-400' : ''}`}>Heure de la prestation</h3>
          <div className="min-w-0 overflow-hidden">
            <label htmlFor="prestation-time" className={`block text-xs mb-2 ${disabled ? 'text-stone-400' : 'text-stone-600'}`}>
              Heure souhaitée
            </label>
            <input
              id="prestation-time"
              type="time"
              value={localTime}
              disabled={disabled}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full max-w-full px-2 md:px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .rdp-custom {
          --rdp-accent-color: #000000;
          --rdp-background-color: #f5f5f4;
          font-family: inherit;
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }

        .rdp-day-button {
          border-radius: 9999px;
          transition: all 0.2s;
          width: 40px;
          height: 40px;
        }

        .rdp-day-button:hover:not(.rdp-disabled) {
          background-color: #e7e5e4;
          border-radius: 9999px;
        }

        .rdp-selected {
          background-color: #000000 !important;
          color: white !important;
          border-radius: 9999px !important;
        }

        .rdp-disabled {
          color: #d1d5db;
          text-decoration: line-through;
          cursor: not-allowed;
        }

        .rdp-disabled:hover {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  )
}
