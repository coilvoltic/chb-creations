import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb
              items={[
                { label: 'Locations', href: '/services/locations' },
                { label: 'Art de table', href: '/services/locations/art-de-table' },
                { label: 'Sous assiettes gold', href: '/services/locations/art-de-table/sous-assiettes-gold' }
              ]}
            />

            <div className="mt-12 grid md:grid-cols-2 gap-12">
              {/* Product Image */}
              <div className="relative h-[500px] bg-stone-50 border border-stone-200 rounded-3xl flex items-center justify-center p-8">
                <img
                  src="/imgs/location/art-de-table/articles/sousAssiettesGold.png"
                  alt="Sous assiettes gold"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-black mb-4">
                    Sous assiettes gold
                  </h1>
                  <p className="text-3xl font-bold text-black">
                    1,00 €
                  </p>
                  <p className="text-stone-600 mt-2">
                    Prix de location
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-stone-700 leading-relaxed">
                    Sous-assiettes dorées qui ajoutent une touche de luxe et de sophistication à votre table.
                    Parfaites pour mettre en valeur votre vaisselle et créer une ambiance raffinée.
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-6">
                  <h2 className="text-xl font-semibold mb-3">Informations</h2>
                  <ul className="space-y-2 text-stone-700">
                    <li>• Location uniquement</li>
                    <li>• Finition dorée brillante</li>
                    <li>• Rehausse l'élégance de votre table</li>
                    <li>• Parfait pour événements chics</li>
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/contact"
                    className="inline-block bg-black text-white px-8 py-4 hover:bg-stone-800 transition-colors text-lg font-medium"
                  >
                    Demander un devis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
