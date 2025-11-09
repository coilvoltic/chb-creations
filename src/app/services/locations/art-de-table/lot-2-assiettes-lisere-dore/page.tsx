'use client'

import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useState } from 'react'

export default function ProductPage() {
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log(`Added ${quantity} items to cart`)
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
                { label: 'Lot 2 assiettes liseré doré', href: '/services/locations/art-de-table/lot-2-assiettes-lisere-dore' }
              ]}
            />

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Product Image */}
              <div className="relative aspect-square bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden">
                <img
                  src="/imgs/location/art-de-table/articles/lot2AssiettesLisereDore.png"
                  alt="Lot 2 assiettes liseré doré"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-black mb-4">
                    Lot 2 assiettes liseré doré
                  </h1>
                  <p className="text-3xl font-bold text-black">
                    1,50 €
                  </p>
                  <p className="text-stone-600 mt-2">
                    Prix de location
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-stone-700 leading-relaxed">
                    Lot de 2 assiettes élégantes avec liseré doré, parfaites pour sublimer vos tables lors d&apos;événements spéciaux.
                    Ces assiettes apportent une touche de raffinement et d&apos;élégance à votre décoration de table.
                  </p>
                </div>

                <div className="border-t border-stone-200 pt-6">
                  <h2 className="text-xl font-semibold mb-3">Informations</h2>
                  <ul className="space-y-2 text-stone-700">
                    <li>• Location uniquement</li>
                    <li>• Lot de 2 assiettes</li>
                    <li>• Finition dorée</li>
                    <li>• Idéal pour mariages et événements</li>
                  </ul>
                </div>

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
