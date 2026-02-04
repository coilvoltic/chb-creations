'use client'

import { useState, useEffect } from 'react'
import type { Tag } from '@/lib/supabase'

interface ReservationTagSelectorProps {
  reservationId: number
  reservationType: 'rental' | 'purchase' | 'prestation'
  currentTags: Tag[]
  onTagsChange?: (tags: Tag[]) => void
}

export default function ReservationTagSelector({
  reservationId,
  reservationType,
  currentTags,
  onTagsChange
}: ReservationTagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchAllTags()
  }, [])

  const fetchAllTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (response.ok) {
        const data = await response.json()
        setAllTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = async (tagId: number) => {
    try {
      const payload: {
        tag_id: number
        rental_reservation_id?: number
        purchase_reservation_id?: number
        prestation_reservation_id?: number
      } = { tag_id: tagId }

      if (reservationType === 'rental') {
        payload.rental_reservation_id = reservationId
      } else if (reservationType === 'purchase') {
        payload.purchase_reservation_id = reservationId
      } else if (reservationType === 'prestation') {
        payload.prestation_reservation_id = reservationId
      }

      const response = await fetch('/api/admin/reservation-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        const newTag = data.reservationTag.tag
        const updatedTags = [...currentTags, newTag]
        if (onTagsChange) {
          onTagsChange(updatedTags)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de l\'ajout du tag')
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      alert('Erreur lors de l\'ajout du tag')
    }
  }

  const removeTag = async (tagId: number) => {
    try {
      // Trouver l'ID de l'association reservation_tags
      // Note: Pour cela, il faudrait une API supplémentaire ou stocker l'ID de l'association
      // Pour simplifier, on va utiliser une approche différente

      // Option 1: Ajouter une route DELETE spéciale qui accepte les paramètres
      const params = new URLSearchParams({
        tag_id: tagId.toString(),
        reservation_type: reservationType,
        reservation_id: reservationId.toString()
      })

      const response = await fetch(`/api/admin/reservation-tags/by-params?${params}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedTags = currentTags.filter(t => t.id !== tagId)
        if (onTagsChange) {
          onTagsChange(updatedTags)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression du tag')
      }
    } catch (error) {
      console.error('Error removing tag:', error)
      alert('Erreur lors de la suppression du tag')
    }
  }

  const availableTags = allTags.filter(
    tag => !currentTags.some(ct => ct.id === tag.id)
  )

  return (
    <div className="relative">
      {/* Tags actuels */}
      <div className="flex flex-wrap gap-2 items-center">
        {currentTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => removeTag(tag.id)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-70"
            style={{
              backgroundColor: tag.color + '20',
              color: tag.color,
              borderColor: tag.color,
              borderWidth: '1px'
            }}
            title="Cliquer pour retirer"
          >
            {tag.name}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ))}

        {/* Bouton pour ajouter un tag */}
        {availableTags.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un tag
            </button>

            {/* Dropdown */}
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[200px] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-2 text-xs text-stone-500">Chargement...</div>
                  ) : availableTags.length === 0 ? (
                    <div className="p-2 text-xs text-stone-500">Aucun tag disponible</div>
                  ) : (
                    availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          addTag(tag.id)
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 transition-colors text-left"
                      >
                        <div
                          className="w-4 h-4 rounded flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-stone-900">{tag.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
