'use client'

import { useState, useEffect } from 'react'

interface PromoMessage {
  id: number
  created_at: string
  msg: string | null
}

export default function PromoMessageManagement() {
  const [messages, setMessages] = useState<PromoMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingMsg, setEditingMsg] = useState<PromoMessage | null>(null)
  const [formMsg, setFormMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/promo-messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching promo messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formMsg.trim()) { setError('Le message est requis'); return }
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/promo-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: formMsg }),
      })
      if (response.ok) {
        const data = await response.json()
        setMessages([data.message, ...messages])
        setFormMsg('')
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
    if (!editingMsg) return
    setError('')
    if (!formMsg.trim()) { setError('Le message est requis'); return }
    try {
      const response = await fetch(`/api/admin/promo-messages/${editingMsg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: formMsg }),
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(messages.map((m) => (m.id === data.message.id ? data.message : m)))
        setEditingMsg(null)
        setFormMsg('')
      } else {
        const err = await response.json()
        setError(err.error || 'Erreur lors de la modification')
      }
    } catch {
      setError('Erreur lors de la modification')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      const response = await fetch(`/api/admin/promo-messages/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessages(messages.filter((m) => m.id !== id))
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const startEdit = (msg: PromoMessage) => {
    setEditingMsg(msg)
    setFormMsg(msg.msg || '')
    setError('')
  }

  const cancelEdit = () => {
    setEditingMsg(null)
    setFormMsg('')
    setError('')
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <p className="text-stone-500">Chargement des messages...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-6 border-b border-stone-200">
        <h2 className="text-xl font-semibold text-black">Messages promotionnels</h2>
        <p className="text-sm text-stone-500 mt-1">
          Messages affichés en bannière de défilement en haut de la navbar
        </p>
      </div>

      {/* Formulaire */}
      <div className="p-6 border-b border-stone-200 bg-stone-50">
        <form onSubmit={editingMsg ? handleUpdate : handleCreate}>
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Texte du message promotionnel…"
              value={formMsg}
              onChange={(e) => { setFormMsg(e.target.value); setError('') }}
              required
              rows={2}
              className="bg-white w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:bg-stone-400 text-sm whitespace-nowrap"
              >
                {editingMsg ? 'Modifier' : 'Ajouter'}
              </button>
              {editingMsg && (
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
        {messages.length === 0 ? (
          <p className="text-stone-500 text-center py-8">Aucun message créé pour le moment</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start justify-between p-3 border border-stone-200 rounded-lg bg-white gap-3"
              >
                {/* Aperçu bannière */}
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-3 py-1 bg-black text-white text-xs rounded mb-2">
                    Aperçu bannière
                  </div>
                  <p className="text-sm text-stone-800 leading-snug">{msg.msg}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 mt-1">
                  <button
                    onClick={() => startEdit(msg)}
                    className="p-1 text-stone-600 hover:text-blue-600 transition-colors"
                    title="Modifier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
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
