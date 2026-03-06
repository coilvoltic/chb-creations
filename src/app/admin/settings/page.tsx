'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TagManagement from '@/components/TagManagement'
import SettingsPanel from '@/components/SettingsPanel'
import PromoCodeManagement from '@/components/PromoCodeManagement'
import PromoMessageManagement from '@/components/PromoMessageManagement'
import { Suspense } from 'react'

type Section = 'tags' | 'horaires' | 'codes-promos' | 'messages-promo'

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<Section>('tags')
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  useEffect(() => {
    // Lire la section depuis l'URL si présente
    const section = searchParams.get('section') as Section | null
    if (section === 'tags' || section === 'horaires' || section === 'codes-promos' || section === 'messages-promo') {
      setActiveSection(section)
    }
  }, [searchParams])

  useEffect(() => {
    // Vérifier l'authentification
    fetch('/api/admin/settings')
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login')
        } else {
          setIsAuthChecked(true)
        }
      })
      .catch(() => router.push('/admin/login'))
  }, [router])

  const handleSectionChange = (section: Section) => {
    setActiveSection(section)
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.replaceState(null, '', url.toString())
  }

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin" />
      </div>
    )
  }

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    {
      id: 'tags',
      label: 'Tags',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: 'horaires',
      label: 'Horaires boutique',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'codes-promos',
      label: 'Codes promos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: 'messages-promo',
      label: 'Messages bannière',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
              title="Retour au dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-black tracking-wide">Paramètres</h1>
              <p className="text-sm text-stone-500">Configuration de la boutique</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar navigation */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              {sections.map((section, i) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors ${
                    i > 0 ? 'border-t border-stone-100' : ''
                  } ${
                    activeSection === section.id
                      ? 'bg-stone-200 text-stone-900'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {activeSection === 'tags' && <TagManagement />}
            {activeSection === 'horaires' && <SettingsPanel />}
            {activeSection === 'codes-promos' && <PromoCodeManagement />}
            {activeSection === 'messages-promo' && <PromoMessageManagement />}
          </div>

        </div>
      </main>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
