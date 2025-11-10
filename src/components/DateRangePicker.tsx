'use client'

import { DayPicker, DateRange } from 'react-day-picker'
import { fr } from 'date-fns/locale'
import { UnavailabilityEntry } from '@/lib/supabase'
import { differenceInDays, eachDayOfInterval, format } from 'date-fns'
import 'react-day-picker/style.css'
import { useState, useEffect } from 'react'

interface DateRangePickerProps {
  unavailabilities?: UnavailabilityEntry[]
  stock: number
  requestedQuantity: number
  selectedRange?: DateRange
  onRangeSelect: (range: DateRange | undefined) => void
  startTime?: string
  endTime?: string
  onTimeChange?: (startTime: string, endTime: string) => void
  disabled?: boolean
}

export default function DateRangePicker({
  unavailabilities = [],
  stock,
  requestedQuantity,
  selectedRange,
  onRangeSelect,
  startTime = '09:00',
  endTime = '18:00',
  onTimeChange,
  disabled = false,
}: DateRangePickerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [localStartTime, setLocalStartTime] = useState(startTime)
  const [localEndTime, setLocalEndTime] = useState(endTime)

  // Calculate which dates are unavailable based on stock and requested quantity
  const disabledDatesSet = new Set(
    (unavailabilities || [])
      .filter((entry) => entry.reserved_products + requestedQuantity > stock)
      .map((entry) => entry.date)
  )

  const disabledDates = Array.from(disabledDatesSet).map((dateStr) => new Date(dateStr))

  // Disable past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Validate existing selection when quantity changes
  useEffect(() => {
    if (!selectedRange || !selectedRange.from || !selectedRange.to) {
      return
    }

    // Check if current range is still valid with new quantity
    const datesInRange = eachDayOfInterval({ start: selectedRange.from, end: selectedRange.to })
    const hasUnavailableDate = datesInRange.some((date) =>
      disabledDatesSet.has(format(date, 'yyyy-MM-dd'))
    )

    if (hasUnavailableDate) {
      setErrorMessage(null)
      setInfoMessage('Les dates sélectionnées ne sont plus disponibles pour cette quantité. Veuillez choisir de nouvelles dates.')
      onRangeSelect(undefined)
    }
  }, [requestedQuantity, disabledDatesSet, selectedRange, onRangeSelect])

  // Custom handler to validate range selection
  const handleRangeSelect = (range: DateRange | undefined) => {
    // Only clear messages if user is starting a new selection (clicking on a date)
    if (range?.from && !range?.to) {
      setErrorMessage(null)
      setInfoMessage(null)
    }

    if (!range || !range.from) {
      // Don't clear messages when clearing selection programmatically
      if (range === undefined && !errorMessage && !infoMessage) {
        onRangeSelect(range)
      }
      return
    }

    // If only start date selected, allow it
    if (!range.to) {
      onRangeSelect(range)
      return
    }

    // Validate: Maximum 4 days
    const daysDiff = differenceInDays(range.to, range.from)
    if (daysDiff > 3) {
      setErrorMessage('La période de location ne peut pas dépasser 4 jours')
      onRangeSelect(undefined)
      return
    }

    // Validate: No unavailable dates in range
    const datesInRange = eachDayOfInterval({ start: range.from, end: range.to })
    const hasUnavailableDate = datesInRange.some((date) =>
      disabledDatesSet.has(format(date, 'yyyy-MM-dd'))
    )

    if (hasUnavailableDate) {
      setErrorMessage('La période sélectionnée contient des dates indisponibles')
      onRangeSelect(undefined)
      return
    }

    // Valid range - clear any messages
    setErrorMessage(null)
    setInfoMessage(null)
    onRangeSelect(range)
  }

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    // Prevent empty values - keep previous value if user deletes
    if (!value) return

    if (type === 'start') {
      setLocalStartTime(value)
      if (onTimeChange) {
        onTimeChange(value, localEndTime)
      }
    } else {
      setLocalEndTime(value)
      if (onTimeChange) {
        onTimeChange(localStartTime, value)
      }
    }
  }

  return (
    <div className={`border border-stone-200 rounded-xl p-4 ${disabled ? 'bg-stone-50 opacity-60' : 'bg-white'}`}>
      {errorMessage && !disabled && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {infoMessage && !disabled && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {infoMessage}
        </div>
      )}
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={disabled ? undefined : handleRangeSelect}
        disabled={disabled ? true : [
          { before: today }, // Disable past dates
          ...disabledDates, // Disable unavailable dates
        ]}
        locale={fr}
        className="rdp-custom"
        classNames={{
          day_button: 'rdp-day-button',
          selected: 'rdp-selected',
          disabled: 'rdp-disabled',
          range_start: 'rdp-range-start',
          range_end: 'rdp-range-end',
          range_middle: 'rdp-range-middle',
        }}
      />

      {/* Time selection */}
      {selectedRange?.from && selectedRange?.to && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          <h3 className={`text-sm font-semibold mb-4 ${disabled ? 'text-stone-400' : ''}`}>Horaires de location</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-time" className={`block text-xs mb-2 ${disabled ? 'text-stone-400' : 'text-stone-600'}`}>
                Heure de début
              </label>
              <input
                id="start-time"
                type="time"
                value={localStartTime}
                disabled={disabled}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="end-time" className={`block text-xs mb-2 ${disabled ? 'text-stone-400' : 'text-stone-600'}`}>
                Heure de fin
              </label>
              <input
                id="end-time"
                type="time"
                value={localEndTime}
                disabled={disabled}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
              />
            </div>
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

        .rdp-range-start,
        .rdp-range-end {
          background-color: #000000 !important;
          color: white !important;
          border-radius: 9999px !important;
        }

        .rdp-range-middle {
          background-color: #f5f5f4 !important;
          color: #000000 !important;
          border-radius: 0 !important;
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
