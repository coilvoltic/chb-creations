'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleValidateOrder = async () => {
    setIsSubmitting(true)

    // TODO: Send order to backend/Supabase
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000))

    alert('Commande validée ! Nous vous contacterons bientôt.')
    clearCart()
    router.push('/')
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-4xl font-bold mb-4">Votre panier est vide</h1>
            <p className="text-stone-600 mb-8">
              Ajoutez des articles pour commencer votre location
            </p>
            <Link
              href="/services/locations"
              className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-stone-800 transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-6 py-12 md:py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Votre panier</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="border border-stone-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          href={`/services/${item.category}/${item.subcategory}/${item.productSlug}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-sm text-stone-600 capitalize">
                          {item.category} › {item.subcategory.replace('-', ' ')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="space-y-1 text-sm text-stone-700">
                      <p>
                        <span className="font-medium">Période :</span>{' '}
                        {item.rentalPeriod.from.toLocaleDateString('fr-FR')} {item.startTime} -{' '}
                        {item.rentalPeriod.to.toLocaleDateString('fr-FR')} {item.endTime}
                      </p>
                      <p>
                        <span className="font-medium">Prix unitaire :</span> {item.pricePerUnit.toFixed(2)} €
                      </p>
                      <p>
                        <span className="font-medium">Quantité :</span> {item.quantity}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">
                        {(item.quantity * item.pricePerUnit).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border border-stone-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-700">
                  <span>Articles ({cart.totalItems})</span>
                  <span>{cart.totalPrice.toFixed(2)} €</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{cart.totalPrice.toFixed(2)} €</span>
                </div>
              </div>

              <button
                onClick={handleValidateOrder}
                disabled={isSubmitting}
                className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Validation...' : 'Valider la commande'}
              </button>

              <Link
                href="/services/locations"
                className="block text-center mt-4 text-stone-600 hover:text-black transition-colors"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
