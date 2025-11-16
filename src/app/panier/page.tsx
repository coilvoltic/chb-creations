'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerInfo } from '@/lib/supabase'
import SuccessModal from '@/components/SuccessModal'
import AddressAutocomplete from '@/components/AddressAutocomplete'

export default function CartPage() {
  const { cart, removeFromCart, clearCart, setDeliveryOption, setDeliveryAddress, updateDeliveryFees } = useCart()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [showPaymentOptions, setShowPaymentOptions] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [reservationId, setReservationId] = useState<number | null>(null)
  const [deliveryAddressInput, setDeliveryAddressInput] = useState('')
  const [isAddressSelected, setIsAddressSelected] = useState(false) // Track if user selected from autocomplete
  const [isCalculatingFees, setIsCalculatingFees] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState<{
    distance: number
    distanceText: string
    duration: string
    baseDeliveryFees: number
    distanceFees: number
    totalDeliveryFees: number
  } | null>(null)

  // Customer info form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Calculer les frais de livraison en fonction de l'adresse
  const handleCalculateDeliveryFees = async (address?: string) => {
    const addressToUse = address || deliveryAddressInput

    console.log('handleCalculateDeliveryFees called')
    console.log('addressToUse:', addressToUse)
    console.log('cart.items:', cart.items)

    if (!addressToUse.trim()) {
      setError('Veuillez saisir une adresse de livraison')
      return
    }

    setIsCalculatingFees(true)
    setError(null)

    try {
      // Calculer les frais de base totaux
      const totalBaseDeliveryFees = cart.items.reduce((sum, item) => {
        console.log(`Item ${item.productName}: baseDeliveryFees=${item.baseDeliveryFees}, quantity=${item.quantity}`)
        return sum + (item.baseDeliveryFees || 0) * item.quantity
      }, 0)

      console.log('totalBaseDeliveryFees:', totalBaseDeliveryFees)

      if (totalBaseDeliveryFees === 0) {
        setError('Aucun produit dans le panier ne nécessite de frais de livraison. Les frais de livraison doivent être configurés pour ce produit.')
        setIsCalculatingFees(false)
        return
      }

      const response = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressToUse,
          baseDeliveryFees: totalBaseDeliveryFees,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du calcul des frais')
      }

      // Mettre à jour les informations de livraison
      setDeliveryInfo(data)
      setDeliveryAddress(addressToUse)
      updateDeliveryFees(data.totalDeliveryFees, data.distance)
    } catch (err) {
      console.error('Erreur calcul frais:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des frais de livraison')
    } finally {
      setIsCalculatingFees(false)
    }
  }

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
    // Vérification du mode de paiement si un acompte est requis
    if (depositAmount > 0 && !paymentMethod) {
      setError('Veuillez sélectionner un mode de paiement')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Préparer les données pour l'API
      const totalWithDelivery = cart.totalPrice + (cart.totalDeliveryFees || 0)
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
        deliveryOption: cart.deliveryOption,
        deliveryFees: cart.totalDeliveryFees || 0,
        totalPrice: totalWithDelivery,
        paymentMethod: paymentMethod, // 'online' | 'cash' | null
      }

      // Si paiement en ligne, créer une session Stripe
      if (paymentMethod === 'online' && depositAmount > 0) {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            reservationData: payload,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
        }

        // Rediriger vers Stripe Checkout
        window.location.href = data.url
        return
      }

      // Si paiement en espèces ou pas d'acompte, créer la réservation directement
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

              {/* Delivery Option Selection */}
              <div className="mb-6 p-4 bg-stone-50 rounded-lg">
                <h3 className="font-semibold mb-3">Mode de récupération</h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="pickup"
                      checked={cart.deliveryOption === 'pickup'}
                      onChange={() => {
                        setDeliveryOption('pickup')
                        setDeliveryAddressInput('')
                        setIsAddressSelected(false)
                        setDeliveryInfo(null)
                        setError(null)
                      }}
                      className="mr-3 w-5 h-5 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Retrait en boutique</span>
                      <p className="text-xs text-stone-600">100 Boulevard de Saint-Loup, 13010 Marseille</p>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value="delivery"
                      checked={cart.deliveryOption === 'delivery'}
                      onChange={() => setDeliveryOption('delivery')}
                      className="mr-3 w-5 h-5 cursor-pointer mt-1"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Livraison à domicile</span>
                      <p className="text-xs text-stone-600 mb-2">Frais calculés selon la distance</p>

                      {cart.deliveryOption === 'delivery' && (
                        <div className="mt-2 space-y-2">
                          <AddressAutocomplete
                            value={deliveryAddressInput}
                            onChange={(value) => {
                              setDeliveryAddressInput(value)
                              // Réinitialiser le flag si l'utilisateur modifie l'adresse manuellement
                              setIsAddressSelected(false)
                              // Réinitialiser les infos de livraison si l'adresse change
                              setDeliveryInfo(null)
                            }}
                            onSelect={(address) => {
                              console.log('Address selected:', address)
                              setDeliveryAddressInput(address)
                              setIsAddressSelected(true)
                              // Calculer automatiquement les frais après sélection
                              handleCalculateDeliveryFees(address)
                            }}
                            placeholder="Saisissez votre adresse de livraison"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black cursor-pointer bg-white hover:border-black transition-colors"
                          />

                          {isCalculatingFees && (
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                              <div className="w-4 h-4 border-2 border-stone-400 border-t-black rounded-full animate-spin"></div>
                              <span>Calcul des frais en cours...</span>
                            </div>
                          )}

                          {deliveryInfo && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-xs space-y-1">
                              <p className="font-medium text-green-800">Frais calculés :</p>
                              <p className="text-stone-700">Distance : {deliveryInfo.distanceText} ({deliveryInfo.distance.toFixed(1)} km)</p>
                              <p className="text-stone-700">Durée estimée : {deliveryInfo.duration}</p>
                              <p className="text-stone-700">Frais de base : {deliveryInfo.baseDeliveryFees.toFixed(2)} €</p>
                              <p className="text-stone-700">Frais de distance (1€/km) : {deliveryInfo.distanceFees.toFixed(2)} €</p>
                              <p className="font-semibold text-green-800">Total livraison : {deliveryInfo.totalDeliveryFees.toFixed(2)} €</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-700">
                  <span>Articles ({cart.totalItems})</span>
                  <span>{cart.totalPrice.toFixed(2)} €</span>
                </div>
                {cart.deliveryOption === 'delivery' && cart.totalDeliveryFees && cart.totalDeliveryFees > 0 && (
                  <div className="flex justify-between text-stone-700">
                    <span>Frais de livraison</span>
                    <span>{cart.totalDeliveryFees.toFixed(2)} €</span>
                  </div>
                )}
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
                  <span>{(cart.totalPrice + (cart.totalDeliveryFees || 0)).toFixed(2)} €</span>
                </div>
                {depositAmount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Informations sur l&apos;acompte :</p>
                    <p>Un acompte de {depositAmount.toFixed(2)} € sera requis pour valider la réservation. Le solde restant de {(cart.totalPrice + (cart.totalDeliveryFees || 0) - depositAmount).toFixed(2)} € sera à régler lors de la {cart.deliveryOption === 'delivery' ? 'livraison' : 'récupération'}.</p>
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
                    onClick={() => {
                      // Validation des champs
                      if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
                        setError('Veuillez remplir tous les champs')
                        return
                      }

                      // Validation email
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (!emailRegex.test(customerInfo.email)) {
                        setError('Email invalide')
                        return
                      }

                      // Validation de l'adresse de livraison si option livraison choisie
                      if (cart.deliveryOption === 'delivery' && !cart.deliveryAddress) {
                        setError('Veuillez calculer les frais de livraison en saisissant votre adresse')
                        return
                      }

                      setError(null)
                      setShowPaymentOptions(true)
                    }}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium"
                  >
                    Continuer vers le paiement
                  </button>

                  <button
                    onClick={() => {
                      setShowCheckoutForm(false)
                      setShowPaymentOptions(false)
                      setError(null)
                    }}
                    className="w-full mt-2 text-stone-600 hover:text-black transition-colors text-sm"
                  >
                    Retour
                  </button>
                </>
              )}

              {/* Payment Options Modal */}
              {showPaymentOptions && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">Mode de paiement</h2>

                    {depositAmount > 0 ? (
                      <>
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800 mb-2">
                            <span className="font-semibold">Acompte requis :</span> {depositAmount.toFixed(2)} €
                          </p>
                          <p className="text-xs text-amber-700">
                            Le solde restant de {(cart.totalPrice + (cart.totalDeliveryFees || 0) - depositAmount).toFixed(2)} € sera à régler lors de la {cart.deliveryOption === 'delivery' ? 'livraison' : 'récupération'}.
                          </p>
                        </div>

                        <div className="space-y-3 mb-6">
                          <p className="text-sm font-medium text-stone-700 mb-3">
                            Choisissez votre mode de paiement pour l&apos;acompte :
                          </p>

                          {/* Paiement en ligne */}
                          <button
                            onClick={() => setPaymentMethod('online')}
                            className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                              paymentMethod === 'online'
                                ? 'border-black bg-stone-50'
                                : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                paymentMethod === 'online' ? 'border-black' : 'border-stone-300'
                              }`}>
                                {paymentMethod === 'online' && (
                                  <div className="w-3 h-3 rounded-full bg-black"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1">Payer l&apos;acompte en ligne</p>
                                <p className="text-xs text-stone-600 mb-2">
                                  Carte bancaire, Apple Pay ou Google Pay
                                </p>
                                <div className="flex gap-2">
                                  <span className="text-xs bg-stone-100 px-2 py-1 rounded">💳 CB</span>
                                  <span className="text-xs bg-stone-100 px-2 py-1 rounded">🍎 Apple Pay</span>
                                  <span className="text-xs bg-stone-100 px-2 py-1 rounded">📱 Google Pay</span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Paiement en espèces */}
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                              paymentMethod === 'cash'
                                ? 'border-black bg-stone-50'
                                : 'border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                paymentMethod === 'cash' ? 'border-black' : 'border-stone-300'
                              }`}>
                                {paymentMethod === 'cash' && (
                                  <div className="w-3 h-3 rounded-full bg-black"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold mb-1">Réserver sans payer l&apos;acompte</p>
                                <p className="text-xs text-stone-600">
                                  Paiement de l&apos;acompte en espèces à la boutique
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
                        <p className="text-sm text-stone-700">
                          Aucun acompte requis pour cette réservation.
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowPaymentOptions(false)
                          setPaymentMethod(null)
                          setError(null)
                        }}
                        className="flex-1 px-6 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleValidateOrder}
                        disabled={isSubmitting || (depositAmount > 0 && !paymentMethod)}
                        className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:bg-stone-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'En cours...' : 'Valider'}
                      </button>
                    </div>
                  </div>
                </div>
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
