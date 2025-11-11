'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerInfo } from '@/lib/supabase'
import SuccessModal from '@/components/SuccessModal'

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [reservationId, setReservationId] = useState<number | null>(null)

  // Customer info form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Calculate deposit based on products with deposit requirements
  const calculateDeposit = () => {
    let totalDeposit = 0
    cart.items.forEach((item) => {
      if (item.depositPercentage && item.depositPercentage > 0) {
        const itemPrice = item.pricePerUnit + (item.selectedOption?.additional_fee || 0)
        const itemTotal = itemPrice * item.quantity
        totalDeposit += (itemTotal * item.depositPercentage) / 100
      }
    })
    return totalDeposit
  }

  const depositAmount = calculateDeposit()
  const cautionAmount = 100 // Caution fixe de 100€ (à ajuster selon vos besoins)

  const handleValidateOrder = async () => {
    // Validation des champs
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      setError('Veuillez remplir tous les champs')
      return
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email)) {
      setError('Email invalide')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Préparer les données pour l'API
      const payload = {
        customerInfo,
        items: cart.items.map((item) => {
          const unitPrice = item.pricePerUnit + (item.selectedOption?.additional_fee || 0)
          return {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: unitPrice,
            selectedOption: item.selectedOption,
            rentalStart: new Date(
              item.rentalPeriod.from.toISOString().split('T')[0] + 'T' + item.startTime
            ).toISOString(),
            rentalEnd: new Date(
              item.rentalPeriod.to.toISOString().split('T')[0] + 'T' + item.endTime
            ).toISOString(),
          }
        }),
        deposit: depositAmount,
        caution: cautionAmount,
      }

      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la réservation')
      }

      // Succès
      clearCart()
      setReservationId(data.reservationId)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Erreur validation commande:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation')
    } finally {
      setIsSubmitting(false)
    }
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
                      {item.selectedOption && (
                        <p className="text-amber-700">
                          <span className="font-medium">Option :</span> {item.selectedOption.name} (+{item.selectedOption.additional_fee.toFixed(2)} €)
                        </p>
                      )}
                      {item.depositPercentage && item.depositPercentage > 0 && (
                        <p className="text-amber-700">
                          <span className="font-medium">Acompte requis :</span> {item.depositPercentage}%
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Quantité :</span> {item.quantity}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">
                        {(item.quantity * (item.pricePerUnit + (item.selectedOption?.additional_fee || 0))).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary & Checkout Form */}
          <div className="lg:col-span-1">
            <div className="border border-stone-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Récapitulatif</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-700">
                  <span>Articles ({cart.totalItems})</span>
                  <span>{cart.totalPrice.toFixed(2)} €</span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between text-amber-700 text-sm font-medium">
                    <span>Acompte à payer</span>
                    <span>{depositAmount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-700 text-sm">
                  <span>Caution</span>
                  <span>{cautionAmount.toFixed(2)} €</span>
                </div>
                <div className="border-t border-stone-200 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{cart.totalPrice.toFixed(2)} €</span>
                </div>
                {depositAmount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Informations sur l&apos;acompte :</p>
                    <p>Un acompte de {depositAmount.toFixed(2)} € sera requis pour valider la réservation. Le solde restant de {(cart.totalPrice - depositAmount).toFixed(2)} € sera à régler lors de la récupération.</p>
                  </div>
                )}
              </div>

              {!showCheckoutForm ? (
                <>
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium"
                  >
                    Valider la commande
                  </button>

                  <Link
                    href="/services/locations"
                    className="block text-center mt-4 text-stone-600 hover:text-black transition-colors"
                  >
                    Continuer mes achats
                  </Link>
                </>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-lg">Vos informations</h3>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
                        Nom *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                        Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">
                        Téléphone *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleValidateOrder}
                    disabled={isSubmitting}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:bg-stone-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Validation en cours...' : 'Confirmer la réservation'}
                  </button>

                  <button
                    onClick={() => {
                      setShowCheckoutForm(false)
                      setError(null)
                    }}
                    className="w-full mt-2 text-stone-600 hover:text-black transition-colors text-sm"
                  >
                    Retour
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modale de succès */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          router.push('/')
        }}
        reservationId={reservationId || 0}
      />
    </div>
  )
}
