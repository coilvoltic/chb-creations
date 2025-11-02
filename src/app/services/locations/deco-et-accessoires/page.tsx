import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

export default function DecoAccessoiresPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full h-[40vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/imgs/locations/deco-et-accessoires/decoAccessoiresMain.png"
            alt="Décoration et Accessoires"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                Déco & Accessoires
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb
              items={[
                { label: 'Locations', href: '/services/locations' },
                { label: 'Déco & Accessoires', href: '/services/locations/deco-et-accessoires' }
              ]}
            />

            <div className="mt-12 text-center space-y-6">
              <p className="text-lg text-stone-700 max-w-2xl mx-auto">
                Découvrez notre collection d'accessoires et d'éléments de décoration pour sublimer vos tables et espaces.
                Des pièces soigneusement sélectionnées pour créer l'ambiance parfaite.
              </p>
              <div className="pt-8">
                <Link
                  href="/contact"
                  className="inline-block bg-black text-white px-8 py-4 hover:bg-stone-800 transition-colors text-lg font-medium"
                >
                  Contactez-nous pour plus d'informations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
