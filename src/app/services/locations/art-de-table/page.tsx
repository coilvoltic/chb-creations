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
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1
                className="text-4xl md:text-5xl font-semibold text-white tracking-[0.2em] uppercase animate-fade-in-up"
              >
                ART DE TABLE
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb
              items={[
                { label: 'Locations', href: '/services/locations' },
                { label: 'Art de table', href: '/services/locations/art-de-table' }
              ]}
            />

            {/* Products Grid */}
            <div className="mt-16 grid md:grid-cols-3 gap-10 md:gap-12">
              {artDeTableData.map((product, index) => (
                <Link
                  key={product.name}
                  href={`/services/locations/art-de-table/${product.name.toLowerCase().replace(/\s+/g, '-').replace(/é/g, 'e')}`}
                  className={`group block animate-scale-in delay-${(index + 1) * 100} cursor-pointer`}
                >
                  <div className="relative h-96 md:h-[450px] overflow-hidden bg-white mb-6 rounded-3xl shadow-soft hover:shadow-dark transition-all duration-300">
                    <img
                      src={`/imgs/location/art-de-table/${product.path}`}
                      alt={product.name}
                      className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-base font-medium group-hover:text-gray-600 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-black">
                      {product.price.toFixed(2)} €
                    </p>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Location
                    </p>
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
