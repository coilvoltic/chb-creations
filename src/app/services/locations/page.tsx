import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function LocationsPage() {
  const categories = [
    {
      title: 'Art de table',
      href: '/services/locations/art-de-table',
      image: '/imgs/location/art-de-table/artDeTableMain.png',
      description: 'Assiettes, couverts et accessoires élégants'
    },
    {
      title: 'Trônes',
      href: '/services/locations/trones',
      image: '/imgs/location/trones/troneMain.jpeg',
      description: 'Trônes majestueux pour vos événements'
    },
    {
      title: 'Déco & Accessoires',
      href: '/services/locations/deco-et-accessoires',
      image: '/imgs/location/deco-et-accessoires/decoAccessoiresMain.png',
      description: 'Décoration et accessoires de table'
    },
    {
      title: 'Tenues Homme',
      href: '/services/locations/tenues-homme',
      image: '/imgs/location/tenues-homme/tenueHommeMain.png',
      description: 'Tenues traditionnelles et modernes'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/imgs/location/mainLocation.png"
            alt="Locations"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl md:text-5xl font-semibold text-white animate-fade-in-up font-satisfy"
              >
                Locations.
              </h1>
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-s md:text-xl text-white/90 font-semibold tracking-wide mt-4 md:mt-6 animate-fade-in-up delay-200">
                  Notre collection de mobilier et accessoires.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {categories.map((category, index) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className={`group block overflow-hidden rounded-3xl shadow-soft hover:shadow-dark transition-all duration-300 animate-scale-in delay-${(index + 1) * 100} cursor-pointer`}
                >
                  <div className="relative h-96 md:h-[500px] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                      <h2 className="text-2xl md:text-3xl font-bold mb-3">
                        {category.title}
                      </h2>
                      <p className="text-sm md:text-base text-white/90 font-light">
                        {category.description}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                        Découvrir
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
