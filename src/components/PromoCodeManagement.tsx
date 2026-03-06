'use client'

import { useState, useEffect } from 'react'

interface PromoCode {
  id: number
  created_at: string
  name: string | null
  discount: number | null
}

export default function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState({ name: '', discount: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/admin/promo-codes')
      if (response.ok) {
        const data = await response.json()
        setPromoCodes(data.promoCodes || [])
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const discount = parseInt(formData.discount)
    if (isNaN(discount) || discount < 1 || discount > 100) {
      setError('La réduction doit être entre 1 et 100')
      return
    }
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, discount }),
      })
      if (response.ok) {
        const data = await response.json()
        setPromoCodes([data.promoCode, ...promoCodes])
        setFormData({ name: '', discount: '' })
      } else {
        const err = await response.json()
        setError(err.error || 'Erreur lors de la création')
      }
    } catch {
      setError('Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCode) return
    setError('')
    const discount = parseInt(formData.discount)
    if (isNaN(discount) || discount < 1 || discount > 100) {
      setError('La réduction doit être entre 1 et 100')
      return
    }
    try {
      const response = await fetch(`/api/admin/promo-codes/${editingCode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, discount }),
      })
      if (response.ok) {
        const data = await response.json()
        setPromoCodes(promoCodes.map((c) => (c.id === data.promoCode.id ? data.promoCode : c)))
        setEditingCode(null)
        setFormData({ name: '', discount: '' })
      } else {
        const err = await response.json()
        setError(err.error || 'Erreur lors de la modification')
      }
    } catch {
      setError('Erreur lors de la modification')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce code promo ?')) return
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setPromoCodes(promoCodes.filter((c) => c.id !== id))
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const startEdit = (code: PromoCode) => {
    setEditingCode(code)
    setFormData({ name: code.name || '', discount: String(code.discount ?? '') })
    setError('')
  }

  const cancelEdit = () => {
    setEditingCode(null)
    setFormData({ name: '', discount: '' })
    setError('')
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <p className="text-stone-500">Chargement des codes promos...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-6 border-b border-stone-200">
        <h2 className="text-xl font-semibold text-black">Codes promotionnels</h2>
        <p className="text-sm text-stone-500 mt-1">
          Créez des codes de réduction applicables lors de la réservation
        </p>
      </div>

      {/* Formulaire */}
      <div className="p-6 border-b border-stone-200 bg-stone-50">
        <form onSubmit={editingCode ? handleUpdate : handleCreate}>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 md:gap-3 items-center">
              {/* Nom du code */}
              <input
                type="text"
                placeholder="Nom du code (ex: PROMO10)"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError('') }}
                required
                className="bg-white flex-[0.6] min-w-0 px-3 md:px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm md:text-base uppercase placeholder:normal-case"
              />
              {/* Réduction */}
              <div className="relative flex-[0.4] min-w-0">
                <input
                  type="number"
                  placeholder="Réduction %"
                  value={formData.discount}
                  onChange={(e) => { setFormData({ ...formData, discount: e.target.value }); setError('') }}
                  required
                  min={1}
                  max={100}
                  className="bg-white w-full px-3 md:px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm md:text-base pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">%</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 whitespace-nowrap text-sm"
              >
                {editingCode ? 'Modifier' : 'Créer'}
              </button>
              {editingCode && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 text-sm"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="p-6">
        {promoCodes.length === 0 ? (
          <p className="text-stone-500 text-center py-8">Aucun code promo créé pour le moment</p>
        ) : (
          <div className="space-y-2">
            {promoCodes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-3 border border-stone-200 rounded-lg bg-white gap-3"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-stone-100 text-stone-800 border border-stone-300 tracking-widest">
                    {code.name}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    -{code.discount}%
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(code)}
                    className="p-1 text-stone-600 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="p-1 text-stone-600 hover:text-red-600 transition-colors"
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
