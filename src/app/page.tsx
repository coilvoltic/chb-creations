import Navbar from '../components/Navbar'
import Link from 'next/link'

export default function Home() {
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/85" />
        </div>
        <div className="relative h-full flex items-end pb-12 md:pb-16">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl">
              <p className="text-sm md:text-base lg:text-lg text-white font-bold uppercase tracking-wide leading-relaxed animate-fade-in-up">
                L&apos;ART DU RAFFINEMENT POUR SUBLIMER VOS ÉVÉNEMENTS.
              </p>
              <p className="text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wide mt-2 animate-fade-in-up delay-200">
                Créations personnalisées, décoration, location et accessoires uniques pour des moments inoubliables
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Locations */}
              <Link href="/services/locations" className="group cursor-pointer">
                <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-dark transition-all duration-300 animate-fade-in-up delay-100">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src="/imgs/location/mainLocation.png"
                      alt="Locations"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Locations</h2>
                    <p className="text-sm text-gray-600 font-light mb-4">
                      Art de table, trônes, décoration et tenues
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                      Découvrir
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Accessoires */}
              <Link href="/services/accessoires" className="group cursor-pointer">
                <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-dark transition-all duration-300 animate-fade-in-up delay-200">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src="/imgs/personnalisation/mainPersonnalisation.jpeg"
                      alt="Accessoires"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Accessoires</h2>
                    <p className="text-sm text-gray-600 font-light mb-4">
                      Créations uniques et personnalisées
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                      Découvrir
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Henné */}
              <Link href="/services/henne" className="group cursor-pointer">
                <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-dark transition-all duration-300 animate-fade-in-up delay-300">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src="/imgs/henne/mainHenne.jpeg"
                      alt="Henné"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Henné</h2>
                    <p className="text-sm text-gray-600 font-light mb-4">
                      Art traditionnel et contemporain
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                      Découvrir
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Décoration */}
              <Link href="/services/decoration" className="group cursor-pointer">
                <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-dark transition-all duration-300 animate-fade-in-up delay-400">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src="/imgs/livraison/mainLivraison.png"
                      alt="Décoration"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <div className="p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Décoration</h2>
                    <p className="text-sm text-gray-600 font-light mb-4">
                      Livraison et installation
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                      Découvrir
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
