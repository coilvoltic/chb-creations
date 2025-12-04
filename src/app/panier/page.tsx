'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerInfo } from '@/lib/supabase'
import { TIME_SLOT_LABELS } from '@/lib/supabase'
import type { CartItem } from '@/lib/cart-types'
import SuccessModal from '@/components/SuccessModal'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import PaymentSimulationModal from '@/components/PaymentSimulationModal'

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    clearCart,
    setRentalDeliveryOption,
    setPurchaseDeliveryOption,
    setPrestationDeliveryOption,
    setRentalDeliveryAddress,
    setPurchaseDeliveryAddress,
    setPrestationDeliveryAddress,
    updateRentalDeliveryFees,
    updatePurchaseDeliveryFees,
    updatePrestationDeliveryFees,
    getRentalItems,
    getPurchaseItems,
    getPrestationItems,
  } = useCart()

  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [reservationCode, setReservationCode] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'online' | 'cash'>('cash')

  // Séparer les items par catégorie
  const rentalItems = getRentalItems()
  const purchaseItems = getPurchaseItems()
  const prestationItems = getPrestationItems()
  const hasRentals = rentalItems.length > 0
  const hasPurchases = purchaseItems.length > 0
  const hasPrestations = prestationItems.length > 0

  // Interface for delivery calculation response
  interface DeliveryCalculationInfo {
    distance: number
    distanceText: string
    duration: string
    baseDeliveryFees: number
    distanceFees: number
    totalDeliveryFees: number
  }

  // États pour la livraison des locations
  const [rentalAddressInput, setRentalAddressInput] = useState('')
  const [isCalculatingRentalFees, setIsCalculatingRentalFees] = useState(false)
  const [rentalDeliveryInfo, setRentalDeliveryInfo] = useState<DeliveryCalculationInfo | null>(null)

  // États pour la livraison des achats
  const [purchaseAddressInput, setPurchaseAddressInput] = useState('')
  const [isCalculatingPurchaseFees, setIsCalculatingPurchaseFees] = useState(false)
  const [purchaseDeliveryInfo, setPurchaseDeliveryInfo] = useState<DeliveryCalculationInfo | null>(null)
  const [useSameAddress, setUseSameAddress] = useState(false)

  // États pour la livraison des prestations
  const [prestationAddressInput, setPrestationAddressInput] = useState('')
  const [isCalculatingPrestationFees, setIsCalculatingPrestationFees] = useState(false)
  const [prestationDeliveryInfo, setPrestationDeliveryInfo] = useState<DeliveryCalculationInfo | null>(null)

  // Customer info form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // Calculer les frais de livraison pour les locations
  const handleCalculateRentalDeliveryFees = async (address?: string) => {
    const addressToUse = address || rentalAddressInput

    if (!addressToUse.trim()) {
      setError('Veuillez saisir une adresse de livraison pour les locations')
      return
    }

    setIsCalculatingRentalFees(true)
    setError(null)

    try {
      const totalBaseDeliveryFees = rentalItems.reduce((sum, item) => {
        return sum + (item.baseDeliveryFees || 0) * item.quantity
      }, 0)

      if (totalBaseDeliveryFees === 0) {
        setRentalDeliveryInfo({
          distance: 0,
          distanceText: '0 km',
          duration: 'N/A',
          baseDeliveryFees: 0,
          distanceFees: 0,
          totalDeliveryFees: 0,
        })
        setRentalDeliveryAddress(addressToUse)
        updateRentalDeliveryFees(0, 0)
        setIsCalculatingRentalFees(false)
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

      setRentalDeliveryInfo(data)
      setRentalDeliveryAddress(addressToUse)
      updateRentalDeliveryFees(data.totalDeliveryFees, data.distance)
    } catch (err) {
      console.error('Erreur calcul frais locations:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des frais de livraison')
    } finally {
      setIsCalculatingRentalFees(false)
    }
  }

  // Calculer les frais de livraison pour les achats
  const handleCalculatePurchaseDeliveryFees = async (address?: string) => {
    const addressToUse = address || purchaseAddressInput

    if (!addressToUse.trim()) {
      setError('Veuillez saisir une adresse de livraison pour les achats')
      return
    }

    setIsCalculatingPurchaseFees(true)
    setError(null)

    try {
      const totalBaseDeliveryFees = purchaseItems.reduce((sum, item) => {
        return sum + (item.baseDeliveryFees || 0) * item.quantity
      }, 0)

      if (totalBaseDeliveryFees === 0) {
        setPurchaseDeliveryInfo({
          distance: 0,
          distanceText: '0 km',
          duration: 'N/A',
          baseDeliveryFees: 0,
          distanceFees: 0,
          totalDeliveryFees: 0,
        })
        setPurchaseDeliveryAddress(addressToUse)
        updatePurchaseDeliveryFees(0, 0)
        setIsCalculatingPurchaseFees(false)
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

      setPurchaseDeliveryInfo(data)
      setPurchaseDeliveryAddress(addressToUse)
      updatePurchaseDeliveryFees(data.totalDeliveryFees, data.distance)
    } catch (err) {
      console.error('Erreur calcul frais achats:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des frais de livraison')
    } finally {
      setIsCalculatingPurchaseFees(false)
    }
  }

  // Calculer les frais de livraison pour les prestations
  const handleCalculatePrestationDeliveryFees = async (address?: string) => {
    const addressToUse = address || prestationAddressInput

    if (!addressToUse.trim()) {
      setError('Veuillez saisir une adresse de livraison pour les prestations')
      return
    }

    setIsCalculatingPrestationFees(true)
    setError(null)

    try {
      const totalBaseDeliveryFees = prestationItems.reduce((sum, item) => {
        return sum + (item.baseDeliveryFees || 0) * item.quantity
      }, 0)

      if (totalBaseDeliveryFees === 0) {
        setPrestationDeliveryInfo({
          distance: 0,
          distanceText: '0 km',
          duration: 'N/A',
          baseDeliveryFees: 0,
          distanceFees: 0,
          totalDeliveryFees: 0,
        })
        setPrestationDeliveryAddress(addressToUse)
        updatePrestationDeliveryFees(0, 0)
        setIsCalculatingPrestationFees(false)
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

      setPrestationDeliveryInfo(data)
      setPrestationDeliveryAddress(addressToUse)
      updatePrestationDeliveryFees(data.totalDeliveryFees, data.distance)
    } catch (err) {
      console.error('Erreur calcul frais prestations:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul des frais de livraison')
    } finally {
      setIsCalculatingPrestationFees(false)
    }
  }

  // Réutiliser une adresse déjà renseignée
  const handleReuseAddressForRentals = () => {
    if (purchaseAddressInput && cart.purchaseDelivery.address) {
      setRentalAddressInput(purchaseAddressInput)
      handleCalculateRentalDeliveryFees(purchaseAddressInput)
    }
  }

  const handleReuseAddressForPurchases = () => {
    if (rentalAddressInput && cart.rentalDelivery.address) {
      setPurchaseAddressInput(rentalAddressInput)
      handleCalculatePurchaseDeliveryFees(rentalAddressInput)
      setUseSameAddress(true)
    }
  }

  const handleReuseAddressForPrestations = () => {
    // Chercher une adresse déjà renseignée (locations ou achats)
    const existingAddress = cart.rentalDelivery.address || cart.purchaseDelivery.address
    if (existingAddress) {
      const sourceInput = cart.rentalDelivery.address ? rentalAddressInput : purchaseAddressInput
      setPrestationAddressInput(sourceInput)
      handleCalculatePrestationDeliveryFees(sourceInput)
    }
  }

  // Calculate total options fees for an item
  const getItemOptionsFees = (item: CartItem) => {
    if (!item.selectedOptions || item.selectedOptions.length === 0) return 0
    return item.selectedOptions.reduce((sum, option) => sum + option.additional_fee, 0)
  }

  // Calculate deposit based on products with deposit requirements
  const calculateDeposit = () => {
    let totalDeposit = 0
    rentalItems.forEach((item) => {
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
    rentalItems.forEach((item) => {
      if (item.cautionPerUnit && item.cautionPerUnit > 0) {
        totalCaution += item.cautionPerUnit * item.quantity
      }
    })
    return totalCaution
  }

  const cautionAmount = calculateCaution()

  // Calculer les sous-totaux
  const calculateRentalSubtotal = () => {
    return rentalItems.reduce((sum, item) => {
      const basePrice = item.pricePerUnit
      const optionsFees = getItemOptionsFees(item)
      const installationFee = (item.needsInstallation && item.installationFees) ? item.installationFees : 0
      return sum + item.quantity * (basePrice + optionsFees + installationFee)
    }, 0)
  }

  const calculatePurchaseSubtotal = () => {
    return purchaseItems.reduce((sum, item) => {
      const basePrice = item.pricePerUnit
      const optionsFees = getItemOptionsFees(item)
      const installationFee = (item.needsInstallation && item.installationFees) ? item.installationFees : 0
      return sum + item.quantity * (basePrice + optionsFees + installationFee)
    }, 0)
  }

  const calculatePrestationSubtotal = () => {
    return prestationItems.reduce((sum, item) => {
      const basePrice = item.pricePerUnit
      const optionsFees = getItemOptionsFees(item)
      return sum + item.quantity * (basePrice + optionsFees)
    }, 0)
  }

  // Vérifier si toutes les adresses de livraison requises sont renseignées
  const isDeliveryInfoComplete = () => {
    // Si locations avec livraison, vérifier l'adresse
    if (hasRentals && cart.rentalDelivery.option === 'delivery' && !cart.rentalDelivery.address) {
      return false
    }
    // Si achats avec livraison, vérifier l'adresse
    if (hasPurchases && cart.purchaseDelivery.option !== 'pickup' && !cart.purchaseDelivery.address) {
      return false
    }
    // Si prestations avec livraison, vérifier l'adresse
    if (hasPrestations && cart.prestationDelivery.option === 'delivery' && !cart.prestationDelivery.address) {
      return false
    }
    return true
  }

  const handleValidateOrder = async () => {
    // Si paiement en ligne et qu'il y a un acompte, ouvrir la modale de paiement
    if (selectedPaymentMethod === 'online' && depositAmount > 0) {
      setShowPaymentModal(true)
      return
    }

    // Sinon, créer directement la réservation (paiement en espèce)
    await createReservation('cash')
  }

  const handlePaymentConfirmed = async () => {
    setShowPaymentModal(false)
    await createReservation('online')
  }

  const createReservation = async (paymentMethod: 'online' | 'cash') => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Validation des données selon le type de commande
      if (hasRentals && cart.rentalDelivery.option === 'delivery' && !cart.rentalDelivery.address) {
        throw new Error('Veuillez saisir une adresse de livraison pour les locations')
      }

      if (hasPurchases && cart.purchaseDelivery.option === 'delivery' && !cart.purchaseDelivery.address) {
        throw new Error('Veuillez saisir une adresse de livraison pour les achats')
      }

      if (hasPrestations && cart.prestationDelivery.option === 'delivery' && !cart.prestationDelivery.address) {
        throw new Error('Veuillez saisir une adresse pour la prestation')
      }

      const totalWithDelivery = cart.totalPrice + cart.rentalDelivery.fees + cart.purchaseDelivery.fees + cart.prestationDelivery.fees

      // Construire le tableau d'items unifié avec les informations de catégorie
      const allItems = [
        ...rentalItems.map((item) => {
          const unitPrice = item.pricePerUnit + getItemOptionsFees(item)
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
            personalizations: item.personalizations,
            needsInstallation: item.needsInstallation,
            installationFees: item.installationFees,
            rentalStart: new Date(
              item.rentalPeriod.from.toISOString().split('T')[0] + 'T' + item.startTime
            ).toISOString(),
            rentalEnd: new Date(
              item.rentalPeriod.to.toISOString().split('T')[0] + 'T' + item.endTime
            ).toISOString(),
          }
        }),
        ...purchaseItems.map((item) => {
          const unitPrice = item.pricePerUnit + getItemOptionsFees(item)
          // Utiliser des dates dummy pour les achats (requis par l'API)
          const now = new Date()
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
            personalizations: item.personalizations,
            needsInstallation: item.needsInstallation,
            installationFees: item.installationFees,
            rentalStart: now.toISOString(),
            rentalEnd: now.toISOString(),
          }
        }),
        ...prestationItems.map((item) => {
          const unitPrice = item.pricePerUnit + getItemOptionsFees(item)
          // Utiliser des dates dummy pour rentalStart/rentalEnd (requis par l'API)
          const now = new Date()
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
            personalizations: item.personalizations,
            prestationDate: item.prestationDate?.toISOString(),
            prestationTimeSlot: item.prestationTimeSlot,
          }
        }),
      ]

      const payload = {
        customerInfo,
        items: allItems,
        deposit: depositAmount,
        caution: cautionAmount,
        rentalDelivery: cart.rentalDelivery,
        purchaseDelivery: cart.purchaseDelivery,
        prestationDelivery: cart.prestationDelivery,
        totalPrice: totalWithDelivery,
        paymentMethod,
      }

      // Créer la réservation
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la réservation')
      }

      setReservationCode(data.reservationCode)
      setShowSuccessModal(true)
    } catch (err) {
      console.error('Erreur validation commande:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCartItem = (item: CartItem) => (
    <div
      key={item.id}
      className="py-4 first:pt-0"
    >
      <div className="flex gap-4 md:gap-6">
        {/* Product Image */}
        <div className="w-20 h-20 md:w-24 md:h-24 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <Link
                href={`/services/${item.category}/${item.subcategory}/${item.productSlug}`}
                className="font-semibold text-base md:text-lg hover:underline block break-words"
              >
                {item.productName}
              </Link>
              <p className="text-xs md:text-sm text-stone-600 capitalize">
                {item.category} › {item.subcategory.replace('-', ' ')}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 hover:text-red-700 text-xs md:text-sm font-medium flex-shrink-0"
            >
              Supprimer
            </button>
          </div>

          <div className="space-y-1 text-xs md:text-sm text-stone-700">
            {/* Show rental period only for rental products */}
            {item.category === 'locations' && (
              <p className="break-words">
                <span className="font-medium">Période :</span>{' '}
                <span className="inline-block">{item.rentalPeriod.from.toLocaleDateString('fr-FR')} {item.startTime}</span>
                {' - '}
                <span className="inline-block">{item.rentalPeriod.to.toLocaleDateString('fr-FR')} {item.endTime}</span>
              </p>
            )}
            {/* Show prestation date/time slot for prestation products */}
            {item.category === 'henne' && item.prestationDate && (
              <div className="space-y-1 text-purple-700">
                <p className="break-words">
                  <span className="font-medium">Date de la prestation :</span>{' '}
                  {item.prestationDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                {item.prestationTimeSlot && (
                  <p className="break-words">
                    <span className="font-medium">Créneau horaire :</span>{' '}
                    {TIME_SLOT_LABELS[item.prestationTimeSlot]}
                  </p>
                )}
              </div>
            )}
            <p>
              <span className="font-medium">Prix unitaire :</span> {item.pricePerUnit.toFixed(2)} €
            </p>
            {item.selectedOptions && item.selectedOptions.length > 0 && (
              <div className="space-y-1">
                {item.selectedOptions.map((option, idx) => (
                  <p key={idx} className="text-blue-700 break-words">
                    <span className="font-medium">{option.option_type_name} :</span> {option.name}
                    {option.additional_fee > 0 && ` (+${option.additional_fee.toFixed(2)} €)`}
                  </p>
                ))}
              </div>
            )}
            {item.personalizations && Object.keys(item.personalizations).length > 0 && (
              <div className="space-y-1 mt-2">
                {Object.entries(item.personalizations).map(([fieldName, value], idx) => (
                  <p key={idx} className="text-stone-700 break-words">
                    <span className="font-medium">✏️ {fieldName} :</span> {value}
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
                <span className="font-medium">Caution :</span> {item.cautionPerUnit.toFixed(2)}€ / unité
              </p>
            )}
            <p>
              <span className="font-medium">Quantité :</span> {item.quantity}
            </p>
          </div>

          {/* Subtotal */}
          <div className="mt-3 md:mt-4 text-right">
            <p className="text-base md:text-lg font-bold">
              {(item.quantity * (item.pricePerUnit + getItemOptionsFees(item) + ((item.needsInstallation && item.installationFees) ? item.installationFees : 0))).toFixed(2)} €
            </p>
          </div>
        </div>
      </div>
      {/* Separator line */}
      <div className="border-b border-stone-200 mt-4"></div>
    </div>
  )

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-4xl font-bold mb-4">Votre panier est vide</h1>
            <p className="text-stone-600 mb-8">
              Ajoutez des articles pour commencer votre commande
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

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 break-words">Votre panier</h1>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items - 2 sections séparées */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 min-w-0">
            {/* Section LOCATIONS */}
            {hasRentals && (
              <div className="border-1 border-blue-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-blue-900">Locations</h2>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {rentalItems.length} article{rentalItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {rentalItems.map(renderCartItem)}
                </div>

                {/* Options de livraison pour les locations */}
                <div className="mt-2 md:mt-4 p-3 md:p-4 bg-blue-50 border border-blue-300 rounded-lg">
                  <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base text-blue-900">Mode de récupération</h3>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rentalDeliveryOption"
                        value="pickup"
                        checked={cart.rentalDelivery.option === 'pickup'}
                        onChange={() => {
                          setRentalDeliveryOption('pickup')
                          setRentalAddressInput('')
                          setRentalDeliveryInfo(null)
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
                        name="rentalDeliveryOption"
                        value="delivery"
                        checked={cart.rentalDelivery.option === 'delivery'}
                        onChange={() => setRentalDeliveryOption('delivery')}
                        className="mr-3 w-5 h-5 cursor-pointer mt-1"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Livraison à domicile</span>
                        <p className="text-xs text-stone-600 mb-2">Frais calculés selon la distance</p>

                        {cart.rentalDelivery.option === 'delivery' && (
                          <div className="mt-2 space-y-2">
                            {hasPurchases && cart.purchaseDelivery.option === 'delivery' && cart.purchaseDelivery.address && !rentalAddressInput && (
                              <button
                                onClick={handleReuseAddressForRentals}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium underline mb-2"
                              >
                                Réutiliser l&apos;adresse renseignée
                              </button>
                            )}

                            <AddressAutocomplete
                              value={rentalAddressInput}
                              onChange={(value) => {
                                setRentalAddressInput(value)
                                setRentalDeliveryInfo(null)
                              }}
                              onSelect={(address) => {
                                setRentalAddressInput(address)
                                handleCalculateRentalDeliveryFees(address)
                              }}
                              placeholder="Adresse de livraison pour les locations"
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />

                            {isCalculatingRentalFees && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <div className="w-4 h-4 border-2 border-stone-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <span>Calcul des frais en cours...</span>
                              </div>
                            )}

                            {rentalDeliveryInfo && (
                              <div className="bg-white border-slate-300 border p-3 rounded-lg text-xs space-y-1">
                                <p className="font-medium text-slate-800">Frais de livraison calculés</p>
                                <p className="text-stone-700">Distance : {rentalDeliveryInfo.distanceText}</p>
                                <p className="font-semibold text-slate-800">Total livraison : {rentalDeliveryInfo.totalDeliveryFees.toFixed(2)} €</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Section ACHATS */}
            {hasPurchases && (
              <div className="border-1 border-green-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-green-900">Achats</h2>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {purchaseItems.length} article{purchaseItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {purchaseItems.map(renderCartItem)}
                </div>

                {/* Options de livraison pour les achats */}
                <div className="mt-2 md:mt-4 p-3 md:p-4 bg-green-50 border border-green-300 rounded-lg">
                  <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base text-green-900">Mode de récupération</h3>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="purchaseDeliveryOption"
                        value="pickup"
                        checked={cart.purchaseDelivery.option === 'pickup'}
                        onChange={() => {
                          setPurchaseDeliveryOption('pickup')
                          setPurchaseAddressInput('')
                          setPurchaseDeliveryInfo(null)
                          setUseSameAddress(false)
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
                        name="purchaseDeliveryOption"
                        value="delivery"
                        checked={cart.purchaseDelivery.option === 'delivery'}
                        onChange={() => setPurchaseDeliveryOption('delivery')}
                        className="mr-3 w-5 h-5 cursor-pointer mt-1"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Livraison à domicile</span>
                        <p className="text-xs text-stone-600 mb-2">Frais calculés selon la distance</p>

                        {cart.purchaseDelivery.option === 'delivery' && (
                          <div className="mt-2 space-y-2">
                            {hasRentals && cart.rentalDelivery.option === 'delivery' && cart.rentalDelivery.address && !useSameAddress && (
                              <button
                                onClick={handleReuseAddressForPurchases}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium underline mb-2"
                              >
                                Réutiliser l&apos;adresse renseignée
                              </button>
                            )}

                            <AddressAutocomplete
                              value={purchaseAddressInput}
                              onChange={(value) => {
                                setPurchaseAddressInput(value)
                                setPurchaseDeliveryInfo(null)
                                setUseSameAddress(false)
                              }}
                              onSelect={(address) => {
                                setPurchaseAddressInput(address)
                                handleCalculatePurchaseDeliveryFees(address)
                              }}
                              placeholder="Adresse de livraison pour les achats"
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            />

                            {isCalculatingPurchaseFees && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <div className="w-4 h-4 border-2 border-stone-200 border-t-green-600 rounded-full animate-spin"></div>
                                <span>Calcul des frais en cours...</span>
                              </div>
                            )}

                            {purchaseDeliveryInfo && (
                              <div className="bg-white border-slate-300 border p-3 rounded-lg text-xs space-y-1">
                                <p className="font-medium text-slate-800">Frais de livraison calculés</p>
                                <p className="text-stone-700">Distance : {purchaseDeliveryInfo.distanceText}</p>
                                <p className="font-semibold text-slate-800">Total livraison : {purchaseDeliveryInfo.totalDeliveryFees.toFixed(2)} €</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="purchaseDeliveryOption"
                        value="relay_point"
                        checked={cart.purchaseDelivery.option === 'relay_point'}
                        onChange={() => {
                          setPurchaseDeliveryOption('relay_point')
                          setPurchaseAddressInput('')
                          setPurchaseDeliveryInfo(null)
                          setUseSameAddress(false)
                        }}
                        className="mr-3 w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Point relais</span>
                        <p className="text-xs text-stone-600">À venir - Service non disponible pour le moment</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Section PRESTATIONS */}
            {hasPrestations && (
              <div className="border-1 border-purple-300 rounded-2xl p-4 md:p-6 bg-white">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <h2 className="text-2xl font-bold text-purple-900">Prestations</h2>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {prestationItems.length} prestation{prestationItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {prestationItems.map(renderCartItem)}
                </div>

                {/* Options de livraison pour les prestations */}
                <div className="mt-2 md:mt-4 p-3 md:p-4 bg-purple-50 border border-purple-300 rounded-lg">
                  <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base text-purple-900">Lieu de la prestation</h3>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="prestationDeliveryOption"
                        value="pickup"
                        checked={cart.prestationDelivery.option === 'pickup'}
                        onChange={() => {
                          setPrestationDeliveryOption('pickup')
                          setPrestationAddressInput('')
                          setPrestationDeliveryInfo(null)
                        }}
                        className="mr-3 w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="font-medium">En boutique</span>
                        <p className="text-xs text-stone-600">100 Boulevard de Saint-Loup, 13010 Marseille</p>
                      </div>
                    </label>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="prestationDeliveryOption"
                        value="delivery"
                        checked={cart.prestationDelivery.option === 'delivery'}
                        onChange={() => setPrestationDeliveryOption('delivery')}
                        className="mr-3 w-5 h-5 cursor-pointer mt-1"
                      />
                      <div className="flex-1">
                        <span className="font-medium">À domicile</span>
                        <p className="text-xs text-stone-600 mb-2">Frais de déplacement calculés selon la distance</p>

                        {cart.prestationDelivery.option === 'delivery' && (
                          <div className="mt-2 space-y-2">
                            {(hasRentals && cart.rentalDelivery.address) || (hasPurchases && cart.purchaseDelivery.address) ? (
                              <button
                                onClick={handleReuseAddressForPrestations}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium underline mb-2"
                              >
                                Réutiliser l&apos;adresse renseignée
                              </button>
                            ) : null}

                            <AddressAutocomplete
                              value={prestationAddressInput}
                              onChange={(value) => {
                                setPrestationAddressInput(value)
                                setPrestationDeliveryInfo(null)
                              }}
                              onSelect={(address) => {
                                setPrestationAddressInput(address)
                                handleCalculatePrestationDeliveryFees(address)
                              }}
                              placeholder="Adresse de la prestation"
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />

                            {isCalculatingPrestationFees && (
                              <div className="flex items-center gap-2 text-sm text-stone-600">
                                <div className="w-4 h-4 border-2 border-stone-200 border-t-purple-600 rounded-full animate-spin"></div>
                                <span>Calcul des frais en cours...</span>
                              </div>
                            )}

                            {prestationDeliveryInfo && (
                              <div className="bg-white border-slate-300 border p-3 rounded-lg text-xs space-y-1">
                                <p className="font-medium text-slate-800">Frais de déplacement calculés</p>
                                <p className="text-stone-700">Distance : {prestationDeliveryInfo.distanceText}</p>
                                <p className="font-semibold text-slate-800">Total déplacement : {prestationDeliveryInfo.totalDeliveryFees.toFixed(2)} €</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 min-w-0">
            <div className="border border-stone-200 rounded-xl p-4 md:p-6 sticky top-30">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Récapitulatif</h2>

              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                {/* Sous-totaux par catégorie */}
                {hasRentals && (
                  <div className="pb-3 border-b border-stone-200">
                    <div className="flex justify-between text-blue-700 font-medium gap-2">
                      <span className="text-sm md:text-base break-words">Locations ({rentalItems.length} article{rentalItems.length > 1 ? 's' : ''})</span>
                      <span className="text-sm md:text-base flex-shrink-0">{calculateRentalSubtotal().toFixed(2)} €</span>
                    </div>
                    {cart.rentalDelivery.option === 'delivery' && cart.rentalDelivery.address && (
                      <div className="flex justify-between text-xs md:text-sm text-stone-600 mt-1 gap-2">
                        <span className="break-words">Frais de livraison</span>
                        <span className="flex-shrink-0">{cart.rentalDelivery.fees.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {hasPurchases && (
                  <div className="pb-3 border-b border-stone-200">
                    <div className="flex justify-between text-green-700 font-medium gap-2">
                      <span className="text-sm md:text-base break-words">Achats ({purchaseItems.length} article{purchaseItems.length > 1 ? 's' : ''})</span>
                      <span className="text-sm md:text-base flex-shrink-0">{calculatePurchaseSubtotal().toFixed(2)} €</span>
                    </div>
                    {cart.purchaseDelivery.option !== 'pickup' && cart.purchaseDelivery.address && (
                      <div className="flex justify-between text-xs md:text-sm text-stone-600 mt-1 gap-2">
                        <span className="break-words">Frais de livraison</span>
                        <span className="flex-shrink-0">{cart.purchaseDelivery.fees.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {hasPrestations && (
                  <div className="pb-3 border-b border-stone-200">
                    <div className="flex justify-between text-purple-700 font-medium gap-2">
                      <span className="text-sm md:text-base break-words">Prestations ({prestationItems.length} prestation{prestationItems.length > 1 ? 's' : ''})</span>
                      <span className="text-sm md:text-base flex-shrink-0">{calculatePrestationSubtotal().toFixed(2)} €</span>
                    </div>
                    {cart.prestationDelivery.option === 'delivery' && cart.prestationDelivery.address && (
                      <div className="flex justify-between text-xs md:text-sm text-stone-600 mt-1 gap-2">
                        <span className="break-words">Frais de déplacement</span>
                        <span className="flex-shrink-0">{cart.prestationDelivery.fees.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total à payer */}
                <div className="pt-3 flex justify-between font-bold text-base md:text-xl gap-2">
                  <span className="break-words">Total à payer</span>
                  <span className="flex-shrink-0">{(cart.totalPrice + cart.rentalDelivery.fees + cart.purchaseDelivery.fees + cart.prestationDelivery.fees).toFixed(2)} €</span>
                </div>

                {/* Informations complémentaires */}
                {(depositAmount > 0 || cautionAmount > 0) && (
                  <div className="border-t border-stone-200 pt-3 space-y-2">
                    <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">Informations complémentaires</p>
                    {depositAmount > 0 && (
                      <div className="flex justify-between text-blue-700 text-xs md:text-sm font-medium gap-2">
                        <span className="break-words">Acompte à verser</span>
                        <span className="flex-shrink-0">{depositAmount.toFixed(2)} €</span>
                      </div>
                    )}
                    {cautionAmount > 0 && (
                      <div className="flex justify-between text-amber-700 text-xs md:text-sm font-medium gap-2">
                        <span className="break-words">Caution (non encaissée)</span>
                        <span className="flex-shrink-0">{cautionAmount.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Explications */}
                {depositAmount > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg break-words">
                    <p className="font-medium mb-1">💳 Acompte :</p>
                    <p>Un acompte de {depositAmount.toFixed(2)} € sera requis pour valider la réservation.</p>
                  </div>
                )}
                {cautionAmount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg break-words">
                    <p className="font-medium mb-1">⚠️ Caution :</p>
                    <p>Une caution de {cautionAmount.toFixed(2)} € sera demandée lors de la récupération (non encaissée sauf dommage).</p>
                  </div>
                )}
              </div>

              {!showCheckoutForm ? (
                <>
                  {!isDeliveryInfoComplete() && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-sm mb-3">
                      ⚠️ Veuillez renseigner une adresse de livraison pour continuer
                    </div>
                  )}
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    disabled={!isDeliveryInfoComplete()}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Valider la commande
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vos informations</h3>

                  <input
                    type="text"
                    placeholder="Prénom"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Nom"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />

                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />

                  {/* Mode de paiement de l'acompte (si acompte requis) */}
                  {depositAmount > 0 && (
                    <div className="border border-stone-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-sm">Mode de paiement de l&apos;acompte</h4>
                      <div className="space-y-2">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={selectedPaymentMethod === 'cash'}
                            onChange={() => setSelectedPaymentMethod('cash')}
                            className="mr-3 w-5 h-5 cursor-pointer mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-sm">Paiement en boutique</span>
                            <p className="text-xs text-stone-600 mt-1">
                              L&apos;acompte de {depositAmount.toFixed(2)} € sera à régler en boutique (espèces, carte ou chèque)
                            </p>
                          </div>
                        </label>
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="online"
                            checked={selectedPaymentMethod === 'online'}
                            onChange={() => setSelectedPaymentMethod('online')}
                            className="mr-3 w-5 h-5 cursor-pointer mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-sm">Paiement en ligne</span>
                            <p className="text-xs text-stone-600 mt-1">
                              Payez l&apos;acompte maintenant par carte bancaire ou Apple Pay
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleValidateOrder}
                    disabled={isSubmitting}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Validation en cours...' : (
                      selectedPaymentMethod === 'online' && depositAmount > 0
                        ? `Payer l'acompte (${depositAmount.toFixed(2)} €)`
                        : 'Confirmer la commande'
                    )}
                  </button>

                  <button
                    onClick={() => setShowCheckoutForm(false)}
                    className="w-full border border-stone-300 px-6 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm"
                  >
                    Retour
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && reservationCode && (
        <SuccessModal
          isOpen={showSuccessModal}
          reservationCode={reservationCode}
          onClose={() => {
            setShowSuccessModal(false)
            clearCart()
            router.push('/')
          }}
        />
      )}

      {/* Payment Simulation Modal */}
      <PaymentSimulationModal
        isOpen={showPaymentModal}
        depositAmount={depositAmount}
        onConfirm={handlePaymentConfirmed}
        onCancel={() => setShowPaymentModal(false)}
      />
    </div>
  )
}
