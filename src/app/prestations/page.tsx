import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Prestations Henné',
  description: 'Art traditionnel du henné pour sublimer vos événements à Marseille. En boutique ou à domicile.',
  path: '/prestations',
  image: '/imgs/prestations/prestationsMain.jpeg',
})

export default function HennePage() {
  const categories = [
    {
      title: 'Henné en Boutique',
      href: '/prestations/henne-boutique',
      image: '/imgs/prestations/henneBoutiqueMain.jpeg',
      description: 'Prestations de henné en boutique avec créneaux fixes'
    },
    {
      title: 'Henné à Domicile',
      href: '/prestations/henne-domicile',
      image: '/imgs/prestations/henneDomicileMain.png',
      description: 'Prestations de henné à votre domicile pour vos événements'
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/imgs/prestations/prestationsMain.jpeg"
            alt="Henné"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-5xl md:text-6xl font-semibold text-white animate-fade-in-up font-cinzel"
              >
                Prestations.
              </h1>
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-s md:text-xl text-white/90 font-semibold tracking-wide mt-4 md:mt-6 animate-fade-in-up delay-200">
                  Art traditionnel du henné pour sublimer vos événements.
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
                  className={`group block overflow-hidden rounded-xl shadow-soft hover:shadow-dark transition-all duration-300 animate-scale-in delay-${(index + 1) * 100} cursor-pointer`}
                >
                  <div className="relative h-96 md:h-[500px] overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 font-cinzel">
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
