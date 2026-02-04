'use client'

import { useState, useEffect } from 'react'
import type { Tag } from '@/lib/supabase'
import { TAG_COLOR_PALETTE } from '@/lib/tag-colors'

export default function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  // Formulaire de création/édition
  const [formData, setFormData] = useState({ name: '', color: TAG_COLOR_PALETTE[2].hex }) // Bleu par défaut

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setTags([...tags, data.tag])
        setFormData({ name: '', color: TAG_COLOR_PALETTE[2].hex }) // Bleu par défaut
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la création du tag')
      }
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Erreur lors de la création du tag')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTag) return

    try {
      const response = await fetch(`/api/admin/tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setTags(tags.map(t => t.id === data.tag.id ? data.tag : t))
        setEditingTag(null)
        setFormData({ name: '', color: TAG_COLOR_PALETTE[2].hex }) // Bleu par défaut
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la modification du tag')
      }
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Erreur lors de la modification du tag')
    }
  }

  const handleDelete = async (tagId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ? Il sera également retiré de toutes les réservations associées.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTags(tags.filter(t => t.id !== tagId))
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression du tag')
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Erreur lors de la suppression du tag')
    }
  }

  const startEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({ name: tag.name, color: tag.color })
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setFormData({ name: '', color: TAG_COLOR_PALETTE[2].hex }) // Bleu par défaut
    setIsColorPickerOpen(false)
  }

  const selectColor = (color: string) => {
    setFormData({ ...formData, color })
    setIsColorPickerOpen(false)
  }

  const getColorName = (hex: string): string => {
    const color = TAG_COLOR_PALETTE.find(c => c.hex.toUpperCase() === hex.toUpperCase())
    return color?.name || hex
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <p className="text-stone-500">Chargement des tags...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-6 border-b border-stone-200">
        <h2 className="text-xl font-semibold text-black">Gestion des tags</h2>
        <p className="text-sm text-stone-500 mt-1">
          Créez et gérez les tags pour organiser vos réservations
        </p>
      </div>

      {/* Formulaire de création/édition */}
      <div className="p-6 border-b border-stone-200 bg-stone-50">
        <form onSubmit={editingTag ? handleUpdate : handleCreate}>
          <div className="flex flex-col gap-3">
            {/* Ligne 1: Nom du tag et Couleur */}
            <div className="flex gap-2 md:gap-3 items-center">
              {/* Nom du tag - 60% */}
              <input
                type="text"
                placeholder="Nom du tag"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white flex-[0.6] min-w-0 px-3 md:px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm md:text-base"
              />

              {/* Sélecteur de couleur avec dropdown - 40% */}
              <div className="relative flex-[0.4] min-w-0">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="w-full flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
                >
                  <div
                    className="w-5 h-5 md:w-6 md:h-6 rounded border border-stone-300 flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-xs md:text-sm text-stone-700 truncate">
                    {getColorName(formData.color)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-stone-500 transition-transform ml-auto flex-shrink-0 ${isColorPickerOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown avec palette de couleurs */}
                {isColorPickerOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsColorPickerOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 bg-white border border-stone-200 rounded-lg shadow-lg z-20 p-3">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {TAG_COLOR_PALETTE.map((colorOption) => {
                          const isSelected = formData.color.toUpperCase() === colorOption.hex.toUpperCase()
                          return (
                            <button
                              key={colorOption.hex}
                              type="button"
                              onClick={() => selectColor(colorOption.hex)}
                              className={`w-5 h-5 md:w-6 md:h-6 rounded-full transition-all hover:scale-110 ${
                                isSelected ? 'scale-110' : ''
                              }`}
                              style={{
                                backgroundColor: colorOption.hex,
                                boxShadow: isSelected
                                  ? `0 0 0 1px white, 0 0 0 3px ${colorOption.hex}`
                                  : undefined
                              }}
                              title={colorOption.name}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ligne 2: Boutons (alignés à gauche) */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 whitespace-nowrap"
              >
                {editingTag ? 'Modifier' : 'Créer'}
              </button>
              {editingTag && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Liste des tags */}
      <div className="p-6">
        {tags.length === 0 ? (
          <p className="text-stone-500 text-center py-8">
            Aucun tag créé pour le moment
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 p-1 border border-stone-200 rounded hover:shadow-md transition-shadow"
              >
                {/* Tag avec style filtre */}
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color,
                    borderWidth: '1px'
                  }}
                >
                  {tag.name}
                </span>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(tag)}
                    className="p-0.5 text-stone-600 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-0.5 text-stone-600 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
