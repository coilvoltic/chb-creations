'use client'

import { useState, useEffect } from 'react'
import type { Tag } from '@/lib/supabase'

interface QuickTagModalProps {
  isOpen: boolean
  onClose: () => void
  reservationId: number
  reservationType: 'rental' | 'purchase' | 'prestation'
  currentTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export default function QuickTagModal({
  isOpen,
  onClose,
  reservationId,
  reservationType,
  currentTags,
  onTagsChange
}: QuickTagModalProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAllTags()
    }
  }, [isOpen])

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
    setIsProcessing(true)
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
        onTagsChange([...currentTags, newTag])
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de l\'ajout du tag')
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      alert('Erreur lors de l\'ajout du tag')
    } finally {
      setIsProcessing(false)
    }
  }

  const removeTag = async (tagId: number) => {
    setIsProcessing(true)
    try {
      const params = new URLSearchParams({
        tag_id: tagId.toString(),
        reservation_type: reservationType,
        reservation_id: reservationId.toString()
      })

      const response = await fetch(`/api/admin/reservation-tags/by-params?${params}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onTagsChange(currentTags.filter(t => t.id !== tagId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression du tag')
      }
    } catch (error) {
      console.error('Error removing tag:', error)
      alert('Erreur lors de la suppression du tag')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleTag = (tag: Tag) => {
    const isCurrentlySelected = currentTags.some(t => t.id === tag.id)
    if (isCurrentlySelected) {
      removeTag(tag.id)
    } else {
      addTag(tag.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">
            Gérer les tags
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-stone-500">
              Chargement des tags...
            </div>
          ) : allTags.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              Aucun tag disponible. Créez-en dans l&apos;onglet &quot;Tags&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-stone-600 mb-3">
                Cliquez sur un tag pour l&apos;ajouter ou le retirer :
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = currentTags.some(t => t.id === tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag)}
                      disabled={isProcessing}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'shadow-md'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color,
                        borderWidth: '1px'
                      }}
                    >
                      {tag.name.length > 20 ? tag.name.slice(0, 20) + '…' : tag.name}
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          style={{ color: tag.color }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
