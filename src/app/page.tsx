'use client'

import Navbar from '../components/Navbar'
import GoogleReviews from '../components/GoogleReviews'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with Image */}
      <section className="relative w-full h-screen overflow-hidden -mt-[104px]">
        <div className="absolute inset-0">
          <Image
            src="/imgs/mainImage.jpeg"
            alt="CHB Créations"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        </div>
        <div className="relative h-full flex items-end pb-12 md:pb-16">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="w-full">
              {/* Keywords aligned left */}
              <div className="text-left mb-8 md:mb-12 animate-fade-in-up">
                <p className="text-2xl md:text-3xl lg:text-4xl text-white font-cinzel font-semibold mb-1 md:mb-1.5">Louez</p>
                <p className="text-2xl md:text-3xl lg:text-4xl text-white font-cinzel font-semibold mb-1 md:mb-1.5">Décorez</p>
                <p className="text-2xl md:text-3xl lg:text-4xl text-white font-cinzel font-semibold">Personnalisez</p>
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
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 font-cinzel">
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
              <Link href="/locations" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-100">
                  <div className="relative aspect-[4/5] overflow-hidden max-h-[500px] md:max-h-[600px] w-full">
                    <Image
                      src="/imgs/locations/locationsMain.png"
                      alt="Locations"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 font-cinzel">Locations</h2>
                      <p className="text-base md:text-lg text-white/80 mb-4 md:mb-5">
                        Art de table, trônes et décoration
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
              <Link href="/accessoires-personnalises" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-200">
                  <div className="relative aspect-[4/5] overflow-hidden max-h-[500px] md:max-h-[600px] w-full">
                    <Image
                      src="/imgs/accessoires-personnalises/accessoiresMain.jpeg"
                      alt="Accessoires"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 font-cinzel">Accessoires</h2>
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
              <Link href="/prestations" className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-2 animate-fade-in-up delay-300">
                  <div className="relative aspect-[4/5] overflow-hidden max-h-[500px] md:max-h-[600px] w-full">
                    <Image
                      src="/imgs/prestations/prestationsMain.jpeg"
                      alt="Henné"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10 text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 font-cinzel">Henné</h2>
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
