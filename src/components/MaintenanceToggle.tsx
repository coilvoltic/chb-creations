'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface MaintenanceStatus {
  is_maintenance: boolean
  message: string
}

export default function MaintenanceToggle() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClientComponentClient()

  // Charger l'état actuel du mode maintenance
  useEffect(() => {
    loadMaintenanceStatus()
  }, [])

  const loadMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_maintenance_status')
        .single()

      if (error) throw error

      const status = data as MaintenanceStatus
      setIsMaintenanceMode(status.is_maintenance)
      setMessage(status.message)
    } catch (err) {
      console.error('Erreur chargement maintenance:', err)
      setError('Erreur lors du chargement du statut')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      // Récupérer l'email de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Utilisateur non connecté')

      // Appeler la fonction SQL pour changer le mode
      const { data, error } = await supabase
        .rpc('toggle_maintenance_mode', {
          new_status: !isMaintenanceMode,
          new_message: message,
          admin_email: user.email
        })

      if (error) throw error

      // Mettre à jour l'état local
      setIsMaintenanceMode(!isMaintenanceMode)
      setSuccess(
        !isMaintenanceMode
          ? '✅ Mode maintenance activé'
          : '✅ Mode maintenance désactivé'
      )

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erreur toggle maintenance:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handleMessageUpdate = async () => {
    setUpdating(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Utilisateur non connecté')

      const { error } = await supabase
        .rpc('toggle_maintenance_mode', {
          new_status: isMaintenanceMode,
          new_message: message,
          admin_email: user.email
        })

      if (error) throw error

      setSuccess('✅ Message mis à jour')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erreur mise à jour message:', err)
      setError(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mode Maintenance</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isMaintenanceMode
              ? 'Le site est actuellement en maintenance'
              : 'Le site est accessible au public'}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={updating}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isMaintenanceMode
              ? 'bg-amber-500 focus:ring-amber-500'
              : 'bg-gray-300 focus:ring-gray-400'
          } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isMaintenanceMode ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Message de maintenance */}
      <div className="mt-4">
        <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-2">
          Message affiché aux visiteurs
        </label>
        <textarea
          id="maintenance-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
          placeholder="Le site est actuellement en maintenance..."
        />
        <button
          onClick={handleMessageUpdate}
          disabled={updating}
          className="mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {updating ? 'Mise à jour...' : 'Mettre à jour le message'}
        </button>
      </div>

      {/* Messages de succès/erreur */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-600">
          ℹ️ Les administrateurs peuvent toujours accéder au site même en mode maintenance.
        </p>
      </div>
    </div>
  )
}
