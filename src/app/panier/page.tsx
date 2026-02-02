'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'
import type { CustomerInfo } from '@/lib/supabase'
import type { CartItem } from '@/lib/cart-types'
import SuccessModal from '@/components/SuccessModal'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import PromoCodeInput from '@/components/PromoCodeInput'
import RelayPointSelector from '@/components/RelayPointSelector'
import type { RelayProvider, RelayPointInfo } from '@/lib/cart-types'

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
    setPurchaseRelayPoint,
    getRentalItems,
    getPurchaseItems,
    getPrestationItems,
    getSubtotal,
    getDiscountAmount,
    getFinalTotal,
  } = useCart()

  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [reservationCode, setReservationCode] = useState<string | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'online' | 'cash'>('cash')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Séparer les items par catégorie
  const rentalItems = getRentalItems()
  const purchaseItems = getPurchaseItems()
  const prestationItems = getPrestationItems()
  const hasRentals = rentalItems.length > 0
  const hasPurchases = purchaseItems.length > 0
  const hasPrestations = prestationItems.length > 0

  // Détection des produits henné spécifiques
  const hasHenneBoutique = prestationItems.some(item =>
    item.productName.toLowerCase().includes('henné en boutique') ||
    item.productSlug.includes('henne-en-boutique')
  )
  const hasHenneDomicile = prestationItems.some(item =>
    item.productName.toLowerCase().includes('henné à domicile') ||
    item.productSlug.includes('henne-a-domicile')
  )

  // Si henné en boutique uniquement, forcer pickup
  const forcePrestationPickup = hasHenneBoutique && !hasHenneDomicile
  // Si henné à domicile uniquement, forcer delivery
  const forcePrestationDelivery = hasHenneDomicile && !hasHenneBoutique

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

  // États pour les points relais (achats uniquement)
  const [relayCustomerAddress, setRelayCustomerAddress] = useState('')
  const [selectedRelayProvider, setSelectedRelayProvider] = useState<RelayProvider | null>(null)
  const [selectedRelayPoint, setSelectedRelayPoint] = useState<RelayPointInfo | null>(null)

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

  // Load user info and saved addresses from cart context on mount
  useEffect(() => {
    const loadUserAndAddresses = async () => {
      // Check if user is logged in with Google
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user)

        // Pre-fill customer info from Google account
        const metadata = session.user.user_metadata
        setCustomerInfo({
          firstName: metadata?.given_name || metadata?.full_name?.split(' ')[0] || '',
          lastName: metadata?.family_name || metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
          phone: metadata?.phone || '',
        })
      }

      // Load saved addresses
      if (cart.rentalDelivery.address) {
        setRentalAddressInput(cart.rentalDelivery.address)
      }
      if (cart.purchaseDelivery.address) {
        setPurchaseAddressInput(cart.purchaseDelivery.address)
      }
      if (cart.prestationDelivery.address) {
        setPrestationAddressInput(cart.prestationDelivery.address)
      }
    }

    loadUserAndAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount - cart is intentionally not in deps

  // Forcer les options de livraison selon le type de henné
  useEffect(() => {
    if (hasPrestations) {
      if (forcePrestationPickup && cart.prestationDelivery.option !== 'pickup') {
        setPrestationDeliveryOption('pickup')
        setPrestationAddressInput('')
        setPrestationDeliveryInfo(null)
      } else if (forcePrestationDelivery && cart.prestationDelivery.option !== 'delivery') {
        setPrestationDeliveryOption('delivery')
      }
    }
  }, [forcePrestationPickup, forcePrestationDelivery, hasPrestations, cart.prestationDelivery.option, setPrestationDeliveryOption])

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
      const response = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressToUse,
          category: 'locations',
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
      const response = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressToUse,
          category: 'accessoires-personnalises',
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
      const response = await fetch('/api/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressToUse,
          category: 'prestations',
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

  // Handlers pour les points relais
  const handleRelayProviderSelect = (provider: RelayProvider | null) => {
    setSelectedRelayProvider(provider)

    // Si null, on réinitialise
    if (!provider) {
      return
    }

    // Reset delivery option in cart when changing provider
    setPurchaseDeliveryOption('relay_point')

    // Mettre à jour les frais immédiatement selon le transporteur sélectionné
    const fees = provider === 'chronopost' ? 18.99 : 9.99
    // Créer un point relais fictif pour stocker le transporteur et les frais
    const relayPoint: RelayPointInfo = {
      id: 'to-be-determined',
      name: `${provider === 'chronopost' ? 'Chronopost' : 'Mondial Relay'} - Point relais le plus proche`,
      address: relayCustomerAddress || 'À déterminer',
      distance: 0,
      provider
    }
    setPurchaseRelayPoint(provider, relayPoint, fees)
  }

  const handleRelayPointSelect = (relayPoint: RelayPointInfo) => {
    // Cette fonction n'est plus utilisée mais gardée pour la compatibilité
    setSelectedRelayPoint(relayPoint)
  }

  // Calculate total options fees for an item
  const getItemOptionsFees = (item: CartItem) => {
    if (!item.selectedOptions || item.selectedOptions.length === 0) return 0
    return item.selectedOptions.reduce((sum, option) => sum + option.additional_fee, 0)
  }

  // Calculate deposit: 50% of total order (all categories + delivery)
  const calculateDeposit = () => {
    const subtotal = getSubtotal() // Includes products, options, installation, and delivery fees
    return subtotal * 0.5 // 50% de la commande totale
  }

  const depositAmount = calculateDeposit()

  // Calculate caution: 50% of rental items subtotal only (locations)
  const calculateCaution = () => {
    if (rentalItems.length === 0) return 0

    let rentalSubtotal = 0
    rentalItems.forEach((item) => {
      const itemPrice = item.pricePerUnit + getItemOptionsFees(item)
      const installationFee = (item.needsInstallation && item.installationFees) ? item.installationFees : 0
      rentalSubtotal += (itemPrice + installationFee) * item.quantity
    })

    return rentalSubtotal * 0.5 // 50% du total des locations
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
    if (hasPurchases && cart.purchaseDelivery.option === 'delivery' && !cart.purchaseDelivery.address) {
      return false
    }
    // Si achats avec point relais, vérifier qu'une adresse et un transporteur sont sélectionnés
    if (hasPurchases && cart.purchaseDelivery.option === 'relay_point') {
      if (!relayCustomerAddress || !selectedRelayProvider) {
        return false
      }
    }
    // Si prestations avec livraison, vérifier l'adresse
    if (hasPrestations && cart.prestationDelivery.option === 'delivery' && !cart.prestationDelivery.address) {
      return false
    }
    return true
  }

  const handleValidateOrder = async () => {
    // Vérifier que tous les champs sont remplis
    if (!customerInfo.firstName.trim()) {
      setError('Le prénom est obligatoire')
      return
    }
    if (!customerInfo.lastName.trim()) {
      setError('Le nom est obligatoire')
      return
    }
    if (!customerInfo.email.trim()) {
      setError('L\'email est obligatoire')
      return
    }
    if (!customerInfo.phone.trim()) {
      setError('Le téléphone est obligatoire')
      return
    }

    // Réinitialiser l'erreur
    setError(null)

    // Si paiement en ligne et qu'il y a un acompte, rediriger vers Stripe Checkout
    if (selectedPaymentMethod === 'online' && depositAmount > 0) {
      await handleStripeCheckout()
      return
    }

    // Sinon, créer directement la réservation (paiement en espèce)
    await createReservation('cash')
  }

  const handleStripeCheckout = async () => {
    setIsProcessingPayment(true)
    setError(null)

    try {
      // Construire les données de réservation
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
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            numberOfPeople: item.numberOfPeople,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
            personalizations: item.personalizations,
            prestationStart: item.prestationStart?.toISOString(),
            prestationEnd: item.prestationEnd?.toISOString(),
          }
        }),
      ]

      const reservationData = {
        customerInfo,
        items: allItems,
        deposit: depositAmount,
        caution: cautionAmount,
        rentalDelivery: cart.rentalDelivery,
        purchaseDelivery: cart.purchaseDelivery,
        prestationDelivery: cart.prestationDelivery,
        totalPrice: getFinalTotal(),
        promoCode: cart.promoCode,
        paymentMethod: 'online',
        userId: currentUser?.id,
      }

      // Créer la session Stripe Checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: depositAmount,
          reservationData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      console.error('Erreur création session Stripe:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la session de paiement')
      setIsProcessingPayment(false)
    }
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
          return {
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            quantity: item.quantity,
            numberOfPeople: item.numberOfPeople,
            pricePerUnit: unitPrice,
            selectedOptions: item.selectedOptions,
            personalizations: item.personalizations,
            prestationStart: item.prestationStart?.toISOString(),
            prestationEnd: item.prestationEnd?.toISOString(),
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
        totalPrice: getFinalTotal(), // Use final total with promo discount
        promoCode: cart.promoCode, // Include promo code if applied
        paymentMethod,
        userId: currentUser?.id, // Include user ID if logged in with Google
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
            {/* Show prestation date/time for prestation products */}
            {item.category === 'prestations' && item.prestationStart && item.prestationEnd && (
              <div className="space-y-1 text-purple-700">
                <p className="break-words">
                  <span className="font-medium">Date de la prestation :</span>{' '}
                  {item.prestationStart.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="break-words">
                  <span className="font-medium">Horaire :</span>{' '}
                  {item.prestationStart.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {item.prestationEnd.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
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
            {/* Afficher la quantité uniquement pour locations et achats (pas pour prestations car quantity = 1 et info dans personalizations) */}
            {item.category !== 'prestations' && (
              <p>
                <span className="font-medium">Quantité :</span> {item.quantity}
              </p>
            )}
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
                    <label className="flex items-start cursor-pointer">
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
                        className="mr-3 w-5 h-5 cursor-pointer mt-1"
                      />
                      <div className="flex-1">
                        <span className="font-medium">Point relais</span>
                        <p className="text-xs text-stone-600 mb-2">Chronopost ou Mondial Relay</p>

                        {cart.purchaseDelivery.option === 'relay_point' && (
                          <div className="mt-2">
                            <RelayPointSelector
                              customerAddress={relayCustomerAddress}
                              onAddressChange={setRelayCustomerAddress}
                              selectedProvider={selectedRelayProvider}
                              onProviderSelect={handleRelayProviderSelect}
                              selectedRelayPoint={selectedRelayPoint}
                              onRelayPointSelect={handleRelayPointSelect}
                            />
                          </div>
                        )}
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

                  {/* Message si mode forcé */}
                  {forcePrestationPickup && (
                    <div className="bg-purple-100 border border-purple-400 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-900 font-medium">
                        ✓ Prestation en boutique uniquement
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        100 Boulevard de Saint-Loup, 13010 Marseille
                      </p>
                    </div>
                  )}

                  {forcePrestationDelivery && (
                    <div className="bg-purple-100 border border-purple-400 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-900 font-medium">
                        ✓ Prestation à domicile uniquement
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Veuillez renseigner l&apos;adresse de la prestation ci-dessous
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Option "En boutique" - masquée si henné à domicile */}
                    {!forcePrestationDelivery && (
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
                          disabled={forcePrestationPickup}
                          className="mr-3 w-5 h-5 cursor-pointer disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <span className="font-medium">En boutique</span>
                          <p className="text-xs text-stone-600">100 Boulevard de Saint-Loup, 13010 Marseille</p>
                        </div>
                      </label>
                    )}

                    {/* Option "À domicile" - masquée si henné en boutique */}
                    {!forcePrestationPickup && (
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="radio"
                          name="prestationDeliveryOption"
                          value="delivery"
                          checked={cart.prestationDelivery.option === 'delivery'}
                          onChange={() => setPrestationDeliveryOption('delivery')}
                          disabled={forcePrestationDelivery}
                          className="mr-3 w-5 h-5 cursor-pointer mt-1 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <span className="font-medium">À domicile</span>
                          <p className="text-xs text-stone-600 mb-2">Frais de déplacement calculés selon la distance</p>
                        </div>
                      </label>
                    )}

                    {/* Champ d'adresse pour livraison à domicile */}
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
                    {cart.purchaseDelivery.option === 'delivery' && cart.purchaseDelivery.address && (
                      <div className="flex justify-between text-xs md:text-sm text-stone-600 mt-1 gap-2">
                        <span className="break-words">Frais de livraison</span>
                        <span className="flex-shrink-0">{cart.purchaseDelivery.fees.toFixed(2)} €</span>
                      </div>
                    )}
                    {cart.purchaseDelivery.option === 'relay_point' && cart.purchaseDelivery.relayPoint && (
                      <div className="flex justify-between text-xs md:text-sm text-stone-600 mt-1 gap-2">
                        <span className="break-words">
                          Point relais {cart.purchaseDelivery.relayProvider === 'chronopost' ? 'Chronopost' : 'Mondial Relay'}
                        </span>
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

                {/* Code promo */}
                <PromoCodeInput />

                {/* Discount (if promo code applied) */}
                {cart.promoCode && getDiscountAmount() > 0 && (
                  <>
                    {/* Subtotal (before discount) */}
                    <div className="pt-3 flex justify-between text-sm md:text-base text-stone-700 gap-2">
                      <span className="break-words">Sous-total</span>
                      <span className="flex-shrink-0">{getSubtotal().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm md:text-base text-green-700 font-medium gap-2">
                      <span className="break-words">Réduction ({cart.promoCode.code} -{cart.promoCode.discount}%)</span>
                      <span className="flex-shrink-0">-{getDiscountAmount().toFixed(2)} €</span>
                    </div>
                  </>
                )}

                {/* Total à payer (after discount) */}
                <div className="pt-2 flex justify-between font-bold text-base md:text-xl gap-2 border-t border-stone-300">
                  <span className="break-words">Total à payer</span>
                  <span className="flex-shrink-0">{getFinalTotal().toFixed(2)} €</span>
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
                    <p>Un acompte de {depositAmount.toFixed(2)} € (50% du total) sera requis pour valider la réservation.</p>
                  </div>
                )}
                {cautionAmount > 0 && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg break-words">
                    <p className="font-medium mb-1">⚠️ Caution :</p>
                    <p>Une caution de {cautionAmount.toFixed(2)} € (50% des locations) sera demandée lors de la récupération (non encaissée sauf dommage).</p>
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
                  <h3 className="font-semibold text-lg">Vos informations <span className="text-red-600 text-sm">* Tous les champs sont obligatoires</span></h3>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Prénom <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={customerInfo.firstName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Nom <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nom"
                      value={customerInfo.lastName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Téléphone <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>

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
                    disabled={isSubmitting || isProcessingPayment}
                    className="w-full bg-black text-white px-6 py-4 rounded-lg hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || isProcessingPayment ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isProcessingPayment ? 'Redirection vers le paiement...' : 'Validation en cours...'}
                      </span>
                    ) : (
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

    </div>
  )
}
