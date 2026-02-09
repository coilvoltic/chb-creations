'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Wrench } from 'lucide-react'

interface MaintenanceStatus {
  is_maintenance: boolean
  message: string
}

export default function MaintenanceToggle() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const supabase = createClientComponentClient()

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
    } catch (err) {
      console.error('Erreur chargement maintenance:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    setUpdating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Utilisateur non connecté')

      await supabase
        .rpc('toggle_maintenance_mode', {
          new_status: !isMaintenanceMode,
          new_message: 'Le site est actuellement en maintenance. Nous revenons bientôt !',
          admin_email: user.email
        })

      setIsMaintenanceMode(!isMaintenanceMode)
    } catch (err) {
      console.error('Erreur toggle maintenance:', err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <button
      onClick={handleToggle}
      disabled={updating}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isMaintenanceMode
          ? 'bg-amber-500 text-white hover:bg-amber-600'
          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
      } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isMaintenanceMode ? 'Désactiver le mode maintenance' : 'Activer le mode maintenance'}
    >
      <Wrench className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isMaintenanceMode ? 'Maintenance ON' : 'Maintenance OFF'}
      </span>
    </button>
  )
}
