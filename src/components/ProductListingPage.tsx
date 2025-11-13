import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import type { Product } from '@/lib/supabase'

interface BreadcrumbItem {
  label: string
  href: string
}

interface ProductListingPageProps {
  products: Product[]
  title: string
  description: string
  heroImage: string
  heroAlt: string
  breadcrumbItems: BreadcrumbItem[]
  categorySlug: string
}

export default function ProductListingPage({
  products,
  title,
  description,
  heroImage,
  heroAlt,
  breadcrumbItems,
  categorySlug,
}: ProductListingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full h-[50vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={heroAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-6 md:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-semibold text-white animate-fade-in-up font-satisfy">
                {title}
              </h1>
              <div className="text-center max-w-3xl mx-auto">
                <p className="text-s md:text-xl text-white/90 font-semibold tracking-wide mt-4 md:mt-6 animate-fade-in-up delay-200">
                  {description}
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
            <Breadcrumb items={breadcrumbItems} />

            {/* Products Grid */}
            <div className="mt-2 md:mt-4 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12">
              {products.map((product, index) => {
                const isOutOfStock = product.is_out_of_stock === true

                return (
                  <div
                    key={product.id}
                    className={`group block animate-scale-in ${!isOutOfStock ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    {isOutOfStock ? (
                      <div className="opacity-60">
                        <div className="relative aspect-square overflow-hidden bg-white mb-4 rounded-xl shadow-soft">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/90" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm md:text-xl">
                              Rupture de stock
                            </span>
                          </div>
                        </div>
                        <div className="text-left space-y-1">
                          <h3 className="text-base font-medium text-stone-500">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {product.new_price ? (
                              <>
                                <p className="text-lg font-bold text-stone-400">
                                  {product.new_price.toFixed(2)} €
                                </p>
                                <p className="text-sm text-stone-400 line-through">
                                  {product.price.toFixed(2)} €
                                </p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-stone-400">
                                {product.price.toFixed(2)} €
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link href={`/services/locations/${categorySlug}/${product.slug}`}>
                        <div className="relative aspect-square overflow-hidden bg-white mb-4 rounded-xl shadow-soft group-hover:shadow-dark transition-all duration-300">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="text-left space-y-1">
                          <h3 className="text-base font-medium">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {product.new_price ? (
                              <>
                                <p className="text-lg font-bold text-red-600">
                                  {product.new_price.toFixed(2)} €
                                </p>
                                <p className="text-sm text-stone-500 line-through">
                                  {product.price.toFixed(2)} €
                                </p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-black">
                                {product.price.toFixed(2)} €
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                )
              })}
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
