'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { getPromotionalMessages, type PromotionalMessage } from '@/lib/supabase'

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [promotionalMessages, setPromotionalMessages] = useState<PromotionalMessage[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const { cart } = useCart()

  // Message statique local (toujours présent)
  const localMessage = "Délais de confection : 30 jours"

  // Combiner le message local avec les messages de la base
  const allMessages = [
    { id: -1, msg: localMessage }, // Message local avec id négatif
    ...promotionalMessages
  ]

  // Fetch promotional messages
  useEffect(() => {
    const fetchMessages = async () => {
      const messages = await getPromotionalMessages()
      setPromotionalMessages(messages)
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

  const shouldBeTransparent = isHomePage && !isScrolled && !isHovered
  const navbarBg = shouldBeTransparent ? 'bg-transparent' : 'bg-white shadow-sm'
  const textColor = shouldBeTransparent ? 'text-white' : 'text-gray-900'
  const hoverColor = shouldBeTransparent ? 'hover:text-gray-300' : 'hover:text-gray-600'
  const bannerBg = shouldBeTransparent ? 'bg-black/50' : 'bg-black'

  return (
    <header
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
        <div className="flex h-16 items-center px-4 md:px-8">
          {/* Logo - Left */}
          <div className="flex-1" onMouseEnter={() => setActiveDropdown(null)}>
            <Link href="/" className="flex items-center">
              <img
                src="/imgs/logo.png"
                alt="CHB Créations"
                className={`h-6 md:h-10 w-auto object-contain transition-opacity duration-300 ${shouldBeTransparent ? 'opacity-0' : 'opacity-100'}`}
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

            {/* Login Button - Desktop / Icon - Mobile */}
            <Link href="/connexion" className="cursor-pointer">
              {/* Desktop: Button with text */}
              <span className={`hidden md:inline-block ${shouldBeTransparent ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg`}>
                Connexion
              </span>
              {/* Mobile: Icon only */}
              <button className={`md:hidden p-1 rounded-full ${shouldBeTransparent ? 'hover:bg-white/20' : 'hover:bg-gray-100'} transition-colors duration-200`}>
                <svg className={`w-5 h-5 md:w-6 md:h-6 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Locations */}
              <Link
                href="/services/locations"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src="/imgs/locations/mainLocation.png"
                    alt="Locations"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                href="/services/accessoires"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src="/imgs/accessoires/accessoiresMain.jpeg"
                    alt="Accessoires"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                href="/services/henne"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src="/imgs/henne/mainHenne.jpeg"
                    alt="Henné"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-sm font-bold mb-1">Henné</h3>
                    <p className="text-xs text-white/90">Prestations traditionnelles</p>
                  </div>
                </div>
              </Link>

              {/* Décoration */}
              <Link
                href="/services/decoration"
                className="group relative overflow-hidden rounded-xl bg-white hover:shadow-lg transition-all duration-300"
                onClick={() => setActiveDropdown(null)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src="/imgs/livraison/mainLivraison.png"
                    alt="Décoration"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-sm font-bold mb-1">Décoration</h3>
                    <p className="text-xs text-white/90">Livraison & installation</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
      </div>
    </header>
  )
}
