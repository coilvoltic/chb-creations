'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const { data } = await supabase
          .rpc('get_maintenance_status')
          .single()

        // Si le mode maintenance est désactivé, rediriger vers l'accueil
        if (!(data as { is_maintenance: boolean })?.is_maintenance) {
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('Erreur vérification maintenance:', error)
        // En cas d'erreur, rediriger vers l'accueil
        router.replace('/')
        return
      }
      setIsLoading(false)
    }

    checkMaintenanceStatus()
  }, [supabase, router])

  if (isLoading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-stone-900 mb-2 tracking-wider">
            CHB CRÉATIONS
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-stone-400 to-transparent mx-auto"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-soft p-8 md:p-10 text-center animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>

          <h2 className="font-cinzel text-2xl md:text-3xl font-semibold text-stone-900 mb-4">
            Site en maintenance
          </h2>

          <p className="text-stone-600 text-base md:text-lg leading-relaxed mb-8">
            Nous effectuons actuellement quelques améliorations.<br />
            Le site sera de nouveau accessible très prochainement.
          </p>

          {/* Contact Card */}
          <div className="border-t border-stone-200 pt-8">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-5 font-inter">
              Une question urgente ?
            </h3>

            <div className="space-y-4">
              <a
                href="mailto:chaymaeb.creations@gmail.com"
                className="group flex items-center justify-center gap-3 text-stone-800 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">chaymaeb.creations@gmail.com</span>
              </a>

              <a
                href="tel:+33667942690"
                className="group flex items-center justify-center gap-3 text-stone-800 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">06 67 94 26 90</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-stone-500 text-sm mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Merci pour votre patience
        </p>
      </div>
    </div>
  )
}
