import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

// Données des produits
const artDeTableData = [
  {
    name: "Lot 2 assiettes liseré doré",
    price: 1.5,
    path: "articles/lot2AssiettesLisereDore.png"
  },
  {
    name: "Lot 2 assiettes simples",
    price: 1,
    path: "articles/lot2AssiettesSimples.png"
  },
  {
    name: "Sous assiettes gold",
    price: 1,
    path: "articles/sousAssiettesGold.png"
  }
]

export default function ArtDeTablePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/imgs/location/art-de-table/artDeTableMain.png"
            alt="Art de table"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl md:text-5xl font-semibold text-white animate-fade-in-up"
              >
                Art de table.
              </h1>
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-s md:text-xl text-white/90 font-semibold tracking-wide mt-10 animate-fade-in-up delay-200">
                  Tout la gamme &quot;Art de table&quot;.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-2 md:py-4 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb
              items={[
                { label: 'Locations', href: '/services/locations' },
                { label: 'Art de table', href: '/services/locations/art-de-table' }
              ]}
            />

            {/* Products Grid */}
            <div className="mt-2 md:mt-4 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12">
              {artDeTableData.map((product, index) => (
                <Link
                  key={product.name}
                  href={`/services/locations/art-de-table/${product.name.toLowerCase().replace(/\s+/g, '-').replace(/é/g, 'e')}`}
                  className={`group block animate-scale-in delay-${(index + 1) * 100} cursor-pointer`}
                >
                  <div className="relative aspect-square overflow-hidden bg-white mb-4 rounded-xl shadow-soft hover:shadow-dark transition-all duration-300">
                    <img
                      src={`/imgs/location/art-de-table/${product.path}`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="text-left space-y-1">
                    <h3 className="text-base font-medium group-hover:text-gray-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-black">
                      {product.price.toFixed(2)} €
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-8">
              Contactez-nous et nous vous aiderons à trouver la solution parfaite pour votre événement.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-base md:text-lg font-medium"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
