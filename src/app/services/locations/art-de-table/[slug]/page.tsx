'use client'

import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useState, useEffect, use } from 'react'
import { getProductBySlug } from '@/actions/products'
import type { Product } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    async function loadProduct() {
      const data = await getProductBySlug(slug)
      if (!data) {
        notFound()
      }
      // Remove duplicate images
      if (data.images) {
        data.images = [...new Set(data.images)]
      }
      setProduct(data)
      setLoading(false)
    }
    loadProduct()
  }, [slug])

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log(`Added ${quantity} of ${product?.name} to cart`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pb-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb
              items={[
                { label: 'Locations', href: '/services/locations' },
                { label: 'Art de table', href: '/services/locations/art-de-table' },
                { label: product.name, href: `/services/locations/art-de-table/${product.slug}` }
              ]}
            />

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Product Images Carousel */}
              <div className="relative">
                <div className="relative aspect-square bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden">
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) =>
                          prev === 0 ? product.images.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-2 transition-all shadow-md"
                        aria-label="Image précédente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) =>
                          prev === product.images.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-2 transition-all shadow-md"
                        aria-label="Image suivante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>

                      {/* Image counter dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              selectedImageIndex === index
                                ? 'bg-white w-6'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Aller à l'image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-black mb-4">
                    {product.name}
                  </h1>
                  <p className="text-3xl font-bold text-black">
                    {product.price.toFixed(2)} €
                  </p>
                  <p className="text-stone-600 mt-2">
                    Prix de location
                  </p>
                </div>

                {product.description && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <div className="text-stone-700 leading-relaxed prose prose-stone max-w-none">
                      <ReactMarkdown>{product.description}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {product.features && product.features.length > 0 && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className="text-xl font-semibold mb-3">Informations</h2>
                    <ul className="space-y-2 text-stone-700">
                      {product.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <label htmlFor="quantity" className="text-lg font-semibold">
                      Quantité :
                    </label>
                    <div className="flex items-center border border-stone-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-stone-100 transition-colors"
                        aria-label="Diminuer la quantité"
                      >
                        -
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border-x border-stone-300 py-2 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 hover:bg-stone-100 transition-colors"
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-black text-white px-8 py-4 rounded-lg hover:bg-stone-800 transition-colors text-lg font-medium"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
