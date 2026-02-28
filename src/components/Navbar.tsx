'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useCart } from '@/contexts/CartContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { PromotionalMessage } from '@/lib/supabase'

interface SearchResult {
  id: number
  name: string
  slug: string
  category: string
  subcategory: string
  images: string[]
  price: number
  new_price?: number
}

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [promotionalMessages, setPromotionalMessages] = useState<PromotionalMessage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === '/'
  const { cart } = useCart()
  const supabase = createClientComponentClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Message statique local (toujours présent)
  const localMessage = "Délais de confection : 30 jours"

  // Combiner le message local avec les messages de la base
  const allMessages = [
    { id: -1, msg: localMessage }, // Message local avec id négatif
    ...promotionalMessages
  ]

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Fetch promotional messages via cached API route (reduces Supabase egress)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/promotional-messages')
        if (res.ok) {
          const messages = await res.json()
          setPromotionalMessages(messages)
        }
      } catch (error) {
        console.error('Error fetching promotional messages:', error)
      }
    }
    fetchMessages()
  }, [])

  // Auto-scroll carousel
  useEffect(() => {
    if (allMessages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % allMessages.length)
    }, 4000) // Change message every 4 seconds

    return () => clearInterval(interval)
  }, [allMessages.length])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [isHomePage])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        closeSearch()
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen])

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    if (searchOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [searchOpen])

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Debounced search
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/search-products?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchResults])

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSelectResult = (result: SearchResult) => {
    router.push(`/${result.category}/${result.subcategory}/${result.slug}`)
    closeSearch()
  }

  const categoryLabel = (cat: string) => {
    if (cat === 'locations') return 'Location'
    if (cat === 'accessoires-personnalises') return 'Accessoire'
    if (cat === 'prestations') return 'Prestation'
    return cat
  }

  const shouldBeTransparent = isHomePage && !isScrolled && !isHovered
  const navbarBg = shouldBeTransparent ? 'bg-transparent' : 'bg-white shadow-sm'
  const textColor = shouldBeTransparent ? 'text-white' : 'text-gray-900'
  const hoverColor = shouldBeTransparent ? 'hover:text-gray-300' : 'hover:text-gray-600'
  const bannerBg = shouldBeTransparent ? 'bg-black/50' : 'bg-black'

  return (
    <>
      {/* Overlay backdrop when menu is open */}
      {activeDropdown === 'services' && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      <header
        ref={dropdownRef}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${navbarBg}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      <div className="mx-auto max-w-screen-2xl">
        {/* Top banner - Promotional messages carousel */}
        <div className={`${bannerBg} text-white py-2 px-4 text-center transition-all duration-300 overflow-hidden`}>
          <div className="relative h-5">
            {allMessages.map((message, index) => (
              <p
                key={message.id}
                className={`text-sm font-medium absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  index === currentMessageIndex
                    ? 'opacity-100 translate-x-0'
                    : index < currentMessageIndex
                    ? 'opacity-0 -translate-x-full'
                    : 'opacity-0 translate-x-full'
                }`}
              >
                {message.msg}
              </p>
            ))}
          </div>
        </div>

        {/* Main navbar */}
        <div className="flex h-16 items-center px-2 md:px-8">
          {/* Logo - Left */}
          <div className="flex-1" onMouseEnter={() => setActiveDropdown(null)}>
            <Link href="/" className="flex items-center">
              <Image
                src="/imgs/logo.png"
                alt="CHB Créations"
                width={120}
                height={40}
                className={`h-5 md:h-10 w-auto object-contain transition-opacity duration-300 ${shouldBeTransparent ? 'opacity-0' : 'opacity-100'}`}
              />
            </Link>
          </div>

          {/* Navigation - Center (Desktop & Mobile) */}
          <nav className="flex items-center justify-center space-x-3 md:space-x-8">
            <Link
              href="/"
              className={`text-xs md:text-sm font-black ${textColor} ${hoverColor} transition-colors duration-200`}
              onMouseEnter={() => setActiveDropdown(null)}
            >
              ACCUEIL
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('services')}
            >
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'services' ? null : 'services')}
                className={`text-xs md:text-sm font-black ${textColor} ${hoverColor} transition-colors duration-200 flex items-center gap-1 cursor-pointer`}
              >
                SERVICES
                <svg className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <Link
              href="/contact"
              className={`text-xs md:text-sm font-black ${textColor} ${hoverColor} transition-colors duration-200`}
              onMouseEnter={() => setActiveDropdown(null)}
            >
              CONTACT
            </Link>
          </nav>

          {/* Right side - Icons and Login button */}
          <div className="flex items-center gap-1 md:gap-4 flex-1 justify-end" onMouseEnter={() => setActiveDropdown(null)}>
            {/* Search icon */}
            <button
              onClick={() => { setSearchOpen(true); setActiveDropdown(null) }}
              className={`p-1 md:p-2 rounded-full ${shouldBeTransparent ? 'hover:bg-white/20' : 'hover:bg-gray-100'} transition-colors duration-200`}
              aria-label="Rechercher un produit"
            >
              <svg className={`w-5 h-5 md:w-6 md:h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
            {/* Cart Icon */}
            <Link href="/panier" className={`relative p-1 md:p-2 rounded-full ${shouldBeTransparent ? 'hover:bg-white/20' : 'hover:bg-gray-100'} transition-colors duration-200 cursor-pointer`}>
              <svg className={`w-5 h-5 md:w-6 md:h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cart.totalItems > 0 && (
                <>
                  {/* Mobile: Simple dot badge without number */}
                  <span className={`md:hidden absolute -top-1 -right-1 rounded-full w-2.5 h-2.5 ${shouldBeTransparent ? 'bg-white' : 'bg-black'}`} />
                  {/* Desktop: Badge with number (99+ if > 99) */}
                  <span className={`hidden md:flex absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 items-center justify-center ${shouldBeTransparent ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {cart.totalItems > 99 ? '99+' : cart.totalItems}
                  </span>
                </>
              )}
            </Link>

            {/* Account Button/Avatar - Desktop & Mobile */}
            <Link href="/compte" className="cursor-pointer">
              {user?.user_metadata?.avatar_url ? (
                /* Logged in: Show avatar */
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden relative border-2 border-white shadow-md hover:shadow-lg transition-all duration-200">
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                /* Not logged in: Show button/icon */
                <>
                  {/* Desktop: Button with text */}
                  <span className={`hidden md:inline-block ${shouldBeTransparent ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg`}>
                    Mon compte
                  </span>
                  {/* Mobile: Icon only */}
                  <button className={`md:hidden p-1 rounded-full ${shouldBeTransparent ? 'hover:bg-white/20' : 'hover:bg-gray-100'} transition-colors duration-200`}>
                    <svg className={`w-5 h-5 md:w-6 md:h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Full Width Services Mega Menu */}
      <div
        className={`absolute left-0 right-0 top-full bg-white shadow-xl border-t border-gray-200 transition-all duration-300 ${
          activeDropdown === 'services'
            ? 'opacity-100 visible translate-y-0'
            : 'opacity-0 invisible -translate-y-4 pointer-events-none'
        }`}
        onMouseEnter={() => setActiveDropdown('services')}
        onMouseLeave={() => setActiveDropdown(null)}
      >
          <div className="container mx-auto px-6 md:px-12 lg:px-16 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Locations */}
              <Link
                href="/locations"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src="/imgs/locations/locationsMain.png"
                    alt="Locations"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-sm font-bold mb-1">Locations</h3>
                    <p className="text-xs text-white/90">Trônes, arches & décoration</p>
                  </div>
                </div>
              </Link>

              {/* Accessoires */}
              <Link
                href="/accessoires-personnalises"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src="/imgs/accessoires-personnalises/accessoiresMain.jpeg"
                    alt="Accessoires"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-sm font-bold mb-1">Accessoires</h3>
                    <p className="text-xs text-white/90">Créations personnalisées</p>
                  </div>
                </div>
              </Link>

              {/* Henné */}
              <Link
                href="/prestations"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src="/imgs/prestations/prestationsMain.jpeg"
                    alt="Prestations"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-sm font-bold mb-1">Prestations</h3>
                    <p className="text-xs text-white/90">Art traditionnel</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
      </div>
    </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-20 px-4">
          <div
            ref={searchContainerRef}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 text-base outline-none placeholder-gray-400 text-gray-900"
              />
              {searchLoading && (
                <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <button onClick={closeSearch} className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Results */}
            {searchQuery.length >= 2 && (
              <div className="max-h-96 overflow-y-auto">
                {searchResults.length === 0 && !searchLoading ? (
                  <p className="text-sm text-gray-500 text-center py-8">Aucun résultat pour &quot;{searchQuery}&quot;</p>
                ) : (
                  <ul>
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          onClick={() => handleSelectResult(result)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {result.images?.[0] ? (
                              <Image
                                src={result.images[0]}
                                alt={result.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{result.name}</p>
                            <p className="text-xs text-gray-500">{categoryLabel(result.category)}</p>
                          </div>
                          {/* Price */}
                          <div className="flex-shrink-0 text-right">
                            {result.new_price ? (
                              <>
                                <p className="text-sm font-semibold text-gray-900">{result.new_price.toFixed(2)} €</p>
                                <p className="text-xs text-gray-400 line-through">{result.price.toFixed(2)} €</p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900">{result.price.toFixed(2)} €</p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Hint when empty */}
            {searchQuery.length < 2 && (
              <p className="text-sm text-gray-400 text-center py-6">Tapez au moins 2 caractères pour rechercher</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
