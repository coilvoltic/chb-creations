'use client'

import { useState, useEffect } from 'react'
import type { BoutiqueHoursDefault, BoutiqueHoursException, BoutiqueTimeSlot } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Vérifie si deux créneaux se chevauchent */
function slotsOverlap(a: BoutiqueTimeSlot, b: BoutiqueTimeSlot): boolean {
  return timeToMinutes(a.start) < timeToMinutes(b.end) &&
    timeToMinutes(a.end) > timeToMinutes(b.start)
}

/** Trie les créneaux par heure de début */
function sortSlots(slots: BoutiqueTimeSlot[]): BoutiqueTimeSlot[] {
  return [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
}

function formatDateFR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ─── Sub-component: slot list editor ────────────────────────────────────────

interface SlotEditorProps {
  slots: BoutiqueTimeSlot[]
  onChange: (slots: BoutiqueTimeSlot[]) => void
  disabled?: boolean
}

function SlotEditor({ slots, onChange, disabled }: SlotEditorProps) {
  const [newStart, setNewStart] = useState('08:00')
  const [newEnd, setNewEnd] = useState('20:00')
  const [error, setError] = useState('')

  const handleAdd = () => {
    if (newStart >= newEnd) {
      setError("L'heure de début doit être avant la fin")
      return
    }
    const newSlot = { start: newStart, end: newEnd }
    const overlap = slots.some((s) => slotsOverlap(s, newSlot))
    if (overlap) {
      setError('Ce créneau chevauche un créneau existant')
      return
    }
    setError('')
    onChange(sortSlots([...slots, newSlot]))
  }

  const handleRemove = (index: number) => {
    onChange(slots.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Liste des créneaux */}
      {slots.length === 0 ? (
        <p className="text-sm text-stone-400 italic">Aucun créneau — la boutique sera fermée</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-sm">
              <span className="font-medium text-stone-800">{slot.start} – {slot.end}</span>
              {!disabled && (
                <button
                  onClick={() => handleRemove(i)}
                  className="text-stone-400 hover:text-red-500 transition-colors ml-1"
                  title="Supprimer ce créneau"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajouter un créneau */}
      {!disabled && (
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Début</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => { setNewStart(e.target.value); setError('') }}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Fin</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => { setNewEnd(e.target.value); setError('') }}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            + Ajouter
          </button>
          {error && <p className="text-xs text-red-600 w-full">{error}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Horaires par défaut
  const [defaultSlots, setDefaultSlots] = useState<BoutiqueTimeSlot[]>([{ start: '08:00', end: '20:00' }])

  // Exceptions par date
  const [exceptions, setExceptions] = useState<BoutiqueHoursException[]>([])

  // Formulaire nouvelle exception
  const [newExcDate, setNewExcDate] = useState('')
  const [newExcClosed, setNewExcClosed] = useState(false)
  const [newExcSlots, setNewExcSlots] = useState<BoutiqueTimeSlot[]>([])

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings?.boutique_hours_default?.slots) {
          setDefaultSlots(data.settings.boutique_hours_default.slots)
        }
        if (data.settings?.boutique_hours_exceptions) {
          setExceptions(data.settings.boutique_hours_exceptions)
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(''), 4000)
  }

  const handleSaveDefaultHours = async () => {
    if (defaultSlots.length === 0) {
      showError('Ajoutez au moins un créneau par défaut')
      return
    }
    const value: BoutiqueHoursDefault = { slots: defaultSlots }
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'boutique_hours_default', value }),
      })
      if (res.ok) {
        showSuccess('Horaires par défaut enregistrés')
      } else {
        const err = await res.json()
        showError(err.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      showError('Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddException = async () => {
    if (!newExcDate) { showError('Veuillez sélectionner une date'); return }
    if (exceptions.some((e) => e.date === newExcDate)) {
      showError('Une exception existe déjà pour cette date')
      return
    }
    if (!newExcClosed && newExcSlots.length === 0) {
      showError('Ajoutez au moins un créneau pour cette exception')
      return
    }

    const exception: BoutiqueHoursException = newExcClosed
      ? { date: newExcDate, closed: true }
      : { date: newExcDate, slots: newExcSlots }

    const updated = [...exceptions, exception].sort((a, b) => a.date.localeCompare(b.date))

    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'boutique_hours_exceptions', value: updated }),
      })
      if (res.ok) {
        setExceptions(updated)
        setNewExcDate('')
        setNewExcClosed(false)
        setNewExcSlots([])
        showSuccess('Exception ajoutée')
      } else {
        const err = await res.json()
        showError(err.error || "Erreur lors de l'ajout")
      }
    } catch {
      showError("Erreur lors de l'ajout")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteException = async (date: string) => {
    const updated = exceptions.filter((e) => e.date !== date)
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'boutique_hours_exceptions', value: updated }),
      })
      if (res.ok) {
        setExceptions(updated)
        showSuccess('Exception supprimée')
      } else {
        const err = await res.json()
        showError(err.error || 'Erreur lors de la suppression')
      }
    } catch {
      showError('Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <p className="text-stone-500">Chargement des paramètres...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorMessage}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {/* En-tête */}
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-xl font-semibold text-black">Horaires Henné boutique</h2>
          <p className="text-sm text-stone-500 mt-1">
            Créneaux disponibles pour les prestations henné en boutique. Vous pouvez définir plusieurs créneaux par jour (ex : 00h–03h et 07h–23h59).
          </p>
        </div>

        {/* Horaires par défaut */}
        <div className="p-6 border-b border-stone-200 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Créneaux par défaut</h3>
          <p className="text-xs text-stone-500 mb-4">Appliqués à tous les jours sauf exceptions</p>
          <SlotEditor slots={defaultSlots} onChange={setDefaultSlots} />
          <button
            onClick={handleSaveDefaultHours}
            disabled={isSaving}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Enregistrer les créneaux par défaut
          </button>
        </div>

        {/* Nouvelle exception */}
        <div className="p-6 border-b border-stone-200 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Ajouter une exception par date</h3>
          <p className="text-xs text-stone-500 mb-4">
            Remplace les créneaux par défaut pour une date spécifique. Cochez &quot;Journée fermée&quot; pour bloquer toute la journée, ou définissez des créneaux personnalisés.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newExcDate}
                  onChange={(e) => setNewExcDate(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="exc-closed"
                  checked={newExcClosed}
                  onChange={(e) => {
                    setNewExcClosed(e.target.checked)
                    if (e.target.checked) setNewExcSlots([])
                  }}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <label htmlFor="exc-closed" className="text-sm text-stone-700 cursor-pointer">
                  Journée fermée
                </label>
              </div>
            </div>

            {!newExcClosed && (
              <div className="p-4 bg-white border border-stone-200 rounded-lg">
                <p className="text-xs text-stone-500 mb-3">Créneaux pour cette date :</p>
                <SlotEditor slots={newExcSlots} onChange={setNewExcSlots} />
              </div>
            )}

            <button
              onClick={handleAddException}
              disabled={isSaving || !newExcDate}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed text-sm transition-colors"
            >
              Ajouter l&apos;exception
            </button>
          </div>
        </div>

        {/* Liste des exceptions */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">
            Exceptions configurées ({exceptions.length})
          </h3>
          {exceptions.length === 0 ? (
            <p className="text-stone-500 text-sm">Aucune exception configurée</p>
          ) : (
            <div className="space-y-2">
              {exceptions.map((exc) => (
                <div key={exc.date} className="flex items-start justify-between p-3 border border-stone-200 rounded-lg bg-white gap-3">
                  <div className="flex items-start gap-3 flex-wrap">
                    <span className="text-sm font-medium text-stone-800 whitespace-nowrap pt-0.5">
                      {formatDateFR(exc.date)}
                    </span>
                    {exc.closed ? (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                        Fermé
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(exc.slots || []).map((slot, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                            {slot.start} – {slot.end}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteException(exc.date)}
                    disabled={isSaving}
                    className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-50 transition-colors rounded shrink-0"
                    title="Supprimer cette exception"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
