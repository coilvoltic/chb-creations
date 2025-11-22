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
  const [showConfirmation, setShowConfirmation] = useState(false)
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

      // Si les frais de base sont à 0, on enregistre quand même l'adresse avec des frais à 0
      if (totalBaseDeliveryFees === 0) {
        setDeliveryInfo({
          distance: 0,
          distanceText: '0 km',
          duration: 'N/A',
          baseDeliveryFees: 0,
          distanceFees: 0,
          totalDeliveryFees: 0,
        })
        setDeliveryAddress(addressToUse)
        updateDeliveryFees(0, 0)
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

  // Calculate total options fees for an item
  const getItemOptionsFees = (item: typeof cart.items[0]) => {
    if (!item.selectedOptions || item.selectedOptions.length === 0) return 0
    return item.selectedOptions.reduce((sum, option) => sum + option.additional_fee, 0)
  }

  // Calculate deposit based on products with deposit requirements
  const calculateDeposit = () => {
    let totalDeposit = 0
    cart.items.forEach((item) => {
      if (item.depositPercentage && item.depositPercentage > 0) {
        const itemPrice = item.pricePerUnit + getItemOptionsFees(item)
        const itemTotal = itemPrice * item.quantity
        totalDeposit += (itemTotal * item.depositPercentage) / 100
      }
    })
    return totalDeposit
  }

  const depositAmount = calculateDeposit()

  // Calculate total caution based on items with caution
  const calculateCaution = () => {
    let totalCaution = 0
    cart.items.forEach((item) => {
      if (item.cautionPerUnit && item.cautionPerUnit > 0) {
        totalCaution += item.cautionPerUnit * item.quantity
      }
    })
    return totalCaution
  }

  const cautionAmount = calculateCaution()

  const handleValidateOrder = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Préparer les données pour l'API
      const totalWithDelivery = cart.totalPrice + (cart.totalDeliveryFees || 0)
      const payload = {
        customerInfo,
        items: cart.items.map((item) => {
          const unitPrice = item.pricePerUnit + getItemOptionsFees(item)
          return {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
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
        paymentMethod: 'cash', // Toujours en espèces pour le moment
      }

      // Créer la réservation directement (paiement en espèces)
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
      setShowConfirmation(false)
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
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="space-y-1">
                          {item.selectedOptions.map((option, idx) => (
                            <p key={idx} className="text-blue-700">
                              <span className="font-medium">{option.option_type_name} :</span> {option.name}
                              {option.additional_fee > 0 && ` (+${option.additional_fee.toFixed(2)} €)`}
                            </p>
                          ))}
                        </div>
                      )}
                      {item.needsInstallation && item.installationFees && (
                        <p className="text-blue-700">
                          <span className="font-medium">Installation :</span> +{item.installationFees}€ / unité
                        </p>
                      )}
                      {item.depositPercentage && item.depositPercentage > 0 && (
                        <p className="text-blue-700">
                          <span className="font-medium">Acompte requis :</span> {item.depositPercentage}%
                        </p>
                      )}
                      {item.cautionPerUnit && item.cautionPerUnit > 0 && (
                        <p className="text-amber-700">
                          <span className="font-medium">Caution :</span> {item.cautionPerUnit.toFixed(2)}€ / unité (soit {(item.cautionPerUnit * item.quantity).toFixed(2)}€ total, non encaissée)
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Quantité :</span> {item.quantity}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-4 text-right">
                      <p className="text-lg font-bold">
                        {(item.quantity * (item.pricePerUnit + getItemOptionsFees(item) + ((item.needsInstallation && item.installationFees) ? item.installationFees : 0))).toFixed(2)} €
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
                              <div className="w-4 h-4 border-2 border-stone-200 border-t-black rounded-full animate-spin"></div>
                              <span>Calcul des frais en cours...</span>
                            </div>
                          )}

                          {deliveryInfo && (
                            <div className={`${deliveryInfo.totalDeliveryFees === 0 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border p-3 rounded-lg text-xs space-y-1`}>
                              {deliveryInfo.totalDeliveryFees === 0 ? (
                                <>
                                  <p className="font-medium text-blue-800">Livraison gratuite !</p>
                                  <p className="text-stone-700">Adresse enregistrée : {deliveryAddressInput}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-green-800">Frais calculés :</p>
                                  <p className="text-stone-700">Distance : {deliveryInfo.distanceText} ({deliveryInfo.distance.toFixed(1)} km)</p>
                                  <p className="text-stone-700">Durée estimée : {deliveryInfo.duration}</p>
                                  <p className="text-stone-700">Frais de base : {deliveryInfo.baseDeliveryFees.toFixed(2)} €</p>
                                  <p className="text-stone-700">Frais de distance (1€/km) : {deliveryInfo.distanceFees.toFixed(2)} €</p>
                                  <p className="font-semibold text-green-800">Total livraison : {deliveryInfo.totalDeliveryFees.toFixed(2)} €</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {/* Montants contribuant au total */}
                <div className="space-y-3">
                  <div className="flex justify-between text-stone-700">
                    <span>Articles ({cart.totalItems})</span>
                    <span>{cart.totalPrice.toFixed(2)} €</span>
                  </div>
                  {cart.deliveryOption === 'delivery' && cart.totalDeliveryFees !== undefined && (
                    <div className="flex justify-between text-stone-700">
                      <span>Frais de livraison</span>
                      <span>{cart.totalDeliveryFees.toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {/* Total à payer */}
                <div className="border-t border-stone-300 pt-3 flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span>{(cart.totalPrice + (cart.totalDeliveryFees || 0)).toFixed(2)} €</span>
                </div>

                {/* Informations complémentaires (non incluses dans le total) */}
                {(depositAmount > 0 || cautionAmount > 0) && (
                  <div className="border-t border-stone-200 pt-3 space-y-2">
                    <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">Informations complémentaires</p>
                    {depositAmount > 0 && (
                      <div className="flex justify-between text-blue-700 text-sm font-medium">
                        <span>Acompte à verser</span>
                        <span>{depositAmount.toFixed(2)} €</span>
                      </div>
                    )}
                    {cautionAmount > 0 && (
                      <div className="flex justify-between text-amber-700 text-sm font-medium">
                        <span>Caution (non encaissée)</span>
                        <span>{cautionAmount.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Explications détaillées */}
                {depositAmount > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">💳 Acompte :</p>
                    <p>Un acompte de {depositAmount.toFixed(2)} € sera requis pour valider la réservation. Vous pouvez payer cet acompte en ligne ou en boutique. Le solde restant de {(cart.totalPrice + (cart.totalDeliveryFees || 0) - depositAmount).toFixed(2)} € sera à régler lors de la {cart.deliveryOption === 'delivery' ? 'livraison' : 'récupération'} de la commande.</p>
                  </div>
                )}
                {cautionAmount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">⚠️ Caution :</p>
                    <p>Une caution de {cautionAmount.toFixed(2)} € sera demandée lors de la {cart.deliveryOption === 'delivery' ? 'livraison' : 'récupération'} (espèces, chèque ou CB). Elle ne sera encaissée qu&apos;en cas de dégradation ou perte du matériel loué.</p>
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
                      setShowConfirmation(true)
                    }}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium"
                  >
                    Continuer vers le paiement
                  </button>

                  <button
                    onClick={() => {
                      setShowCheckoutForm(false)
                      setShowConfirmation(false)
                      setError(null)
                    }}
                    className="w-full mt-2 text-stone-600 hover:text-black transition-colors text-sm"
                  >
                    Retour
                  </button>
                </>
              )}

              {/* Confirmation Modal */}
              {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-4">Confirmer la réservation</h2>

                    {depositAmount > 0 ? (
                      <>
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800 mb-2">
                            <span className="font-semibold">Acompte requis :</span> {depositAmount.toFixed(2)} €
                          </p>
                          <p className="text-xs text-amber-700">
                            L&apos;acompte sera à payer en espèces lors de la {cart.deliveryOption === 'delivery' ? 'livraison' : 'récupération en boutique'}.
                          </p>
                          <p className="text-xs text-amber-700 mt-2">
                            Le solde restant de {(cart.totalPrice + (cart.totalDeliveryFees || 0) - depositAmount).toFixed(2)} € sera également à régler à ce moment.
                          </p>
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
                          setShowConfirmation(false)
                          setError(null)
                        }}
                        className="flex-1 px-6 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleValidateOrder}
                        disabled={isSubmitting}
                        className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:bg-stone-400 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'En cours...' : 'Confirmer la réservation'}
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
