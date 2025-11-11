'use client'

import Navbar from '../components/Navbar'
import GoogleReviews from '../components/GoogleReviews'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

export default function Home() {
  const typedElement = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typedElement.current) {
      const typed = new Typed(typedElement.current, {
        strings: ['vaisselle.', 'mobilier.', 'trône.', 'arche.'],
        typeSpeed: 80,
        backSpeed: 60,
        backDelay: 2000,
        loop: true,
        cursorChar: '|',
      })

      return () => {
        typed.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with Image */}
      <section className="relative w-full h-screen overflow-hidden -mt-[104px]">
        <div className="absolute inset-0">
          <img
            src="/imgs/mainImage.jpeg"
            alt="CHB Créations"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        </div>
        <div className="relative h-full flex items-end pb-12 md:pb-16">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="w-full">
              {/* Keywords aligned left */}
              <div className="text-left mb-8 md:mb-12 animate-fade-in-up">
                <p className="text-3xl md:text-4xl lg:text-5xl text-white font-satisfy mb-1 md:mb-1.5">Louez</p>
                <p className="text-3xl md:text-4xl lg:text-5xl text-white font-satisfy mb-1 md:mb-1.5">Décorez</p>
                <p className="text-3xl md:text-4xl lg:text-5xl text-white font-satisfy">Personnalisez</p>
              </div>

              {/* Existing content centered */}
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-s md:text-xl text-white/90 font-semibold tracking-wide mt-4 animate-fade-in-up delay-200">
                  Tout pour vos évènements · 100% en ligne
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative">
        {/* White background section for title */}
        <div className="bg-white pt-14 md:pt-20 lg:pt-28 pb-7 md:pb-10 lg:pb-14">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            {/* Section Title - on white background */}
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 font-satisfy">
                Tous nos services
              </h2>
              <p className="text-s md:text-xl text-gray-600 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour sublimer vos événements.
              </p>
            </div>
          </div>
        </div>

        {/* White background section for cards */}
        <div className="bg-white pt-7 md:pt-10 lg:pt-14 pb-7 md:pb-10 lg:pb-14">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Locations */}
              <Link href="/services/locations" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-100">
                  <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
                    <img
                      src="/imgs/location/mainLocation.png"
                      alt="Locations"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-4xl md:text-5xl font-bold mb-3 font-satisfy">Locations</h2>
                      <p className="text-base md:text-lg text-white/80 mb-4 md:mb-5">
                        Art de table, trônes, décoration et tenues
                      </p>
                      <span className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-white/90">
                        Découvrir
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Accessoires */}
              <Link href="/services/accessoires" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-200">
                  <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
                    <img
                      src="/imgs/personnalisation/mainPersonnalisation.jpeg"
                      alt="Accessoires"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-4xl md:text-5xl font-bold mb-3 font-satisfy">Accessoires</h2>
                      <p className="text-base md:text-lg text-white/80 mb-4 md:mb-5">
                        Créations uniques et personnalisées
                      </p>
                      <span className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-white/90">
                        Découvrir
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Henné */}
              <Link href="/services/henne" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-300">
                  <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
                    <img
                      src="/imgs/henne/mainHenne.jpeg"
                      alt="Henné"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-4xl md:text-5xl font-bold mb-3 font-satisfy">Henné</h2>
                      <p className="text-base md:text-lg text-white/80 mb-4 md:mb-5">
                        Art traditionnel et contemporain
                      </p>
                      <span className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-white/90">
                        Découvrir
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Décoration */}
              <Link href="/services/decoration" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-400">
                  <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
                    <img
                      src="/imgs/livraison/mainLivraison.png"
                      alt="Décoration"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-4xl md:text-5xl font-bold mb-3 font-satisfy">Décoration</h2>
                      <p className="text-base md:text-lg text-white/80 mb-4 md:mb-5">
                        Livraison et installation
                      </p>
                      <span className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-white/90">
                        Découvrir
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Google Reviews Section */}
      <GoogleReviews />
    </div>
  );
}
