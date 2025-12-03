'use client'

import { DayPicker } from 'react-day-picker'
import { fr } from 'date-fns/locale'
import 'react-day-picker/style.css'

interface PrestationDatePickerProps {
  selectedDate: Date | null
  onDateChange: (date: Date) => void
  minDate?: Date
  disabled?: boolean
}

export default function PrestationDatePicker({
  selectedDate,
  onDateChange,
  minDate,
  disabled = false,
}: PrestationDatePickerProps) {

  // Disable past dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !disabled) {
      onDateChange(date)
    }
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
