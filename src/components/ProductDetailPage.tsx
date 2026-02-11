'use client'

import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import DateRangePicker from '@/components/DateRangePicker'
import PrestationDatePicker from '@/components/PrestationDatePicker'
import TimePickerBoutique from '@/components/TimePickerBoutique'
import TimeSlotPickerFixed, { getSlotTimes } from '@/components/TimeSlotPickerFixed'
import { useState, useEffect, use } from 'react'
import { getProductBySlug } from '@/actions/products'
import type { Product } from '@/lib/supabase'
import { notFound, useRouter } from 'next/navigation'
import { parseSimpleMarkdown } from '@/lib/markdown'
import type { DateRange } from 'react-day-picker'
import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href: string
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
  breadcrumbItems: BreadcrumbItem[]
}

export default function ProductDetailPage({ params, breadcrumbItems }: ProductDetailPageProps) {
  const { slug } = use(params)

  // Extract subcategory automatically from the last breadcrumb href
  // Example: '/accessoires-personnalises/certificats-mariage' -> 'certificats-mariage'
  const subcategory = breadcrumbItems[breadcrumbItems.length - 1]?.href.split('/').pop() || undefined
  const router = useRouter()
  const { addToCart, cart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [rentalPeriod, setRentalPeriod] = useState<DateRange | undefined>()
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [activeTab, setActiveTab] = useState<'description' | 'faq'>('description')
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null)
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<{ [key: number]: number }>({})
  const [needsInstallation, setNeedsInstallation] = useState(false)
  const [personalizationValues, setPersonalizationValues] = useState<{ [key: string]: string }>({})

  // Determine if this is a rental, purchase, or prestation product
  const isRentalProduct = product?.category === 'locations'
  const isPurchaseProduct = product?.category === 'accessoires-personnalises'
  const isPrestationProduct = product?.category === 'prestations'

  // State for prestation date/time
  const [prestationDate, setPrestationDate] = useState<Date | null>(null)
  const [prestationTime, setPrestationTime] = useState<string | null>(null) // Format HH:MM pour henné en boutique
  const [prestationSlot, setPrestationSlot] = useState<'LUNCH' | 'AFTERNOON' | 'EVENING' | null>(null) // Créneau fixe pour henné à domicile
  const [numberOfPeople, setNumberOfPeople] = useState<string>('')
  const [prestationTimeConflict, setPrestationTimeConflict] = useState(false)

  // Déterminer le type de henné (boutique ou domicile) via subcategory
  const isHenneBoutique = product?.subcategory === 'henne-boutique'
  const isHenneDomicile = product?.subcategory === 'henne-domicile'

  // Get effective price (new_price if available, otherwise price)
  const getEffectivePrice = () => {
    if (!product) return 0
    return product.new_price ?? product.price
  }

  // Calculate total options fees from all selected options
  const getTotalOptionsFees = () => {
    if (!product || !product.options || product.options.length === 0) return 0

    let totalFees = 0
    product.options.forEach((optionGroup, groupIndex) => {
      const selectedIndex = selectedOptionIndices[groupIndex] ?? 0
      const selectedOption = optionGroup.options[selectedIndex]
      if (selectedOption) {
        totalFees += selectedOption.additional_fee
      }
    })
    return totalFees
  }

  // Calculate total price with selected options and installation
  const getTotalPrice = () => {
    if (!product) return 0
    const basePrice = getEffectivePrice()
    const optionsFees = getTotalOptionsFees()
    const installationFee = (needsInstallation && product.installation_fees) ? product.installation_fees : 0
    return basePrice + optionsFees + installationFee
  }


  useEffect(() => {
    async function loadProduct() {
      const data = await getProductBySlug(slug, subcategory)
      if (!data) {
        notFound()
      }
      // Block access to out of stock products
      if (data.is_out_of_stock === true) {
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
  }, [slug, subcategory])

  // Get total duration by summing ALL selected options durations
  const getTotalPrestationDuration = (): number => {
    if (!product || !product.options || product.options.length === 0) return 60 // Default 60 min

    let totalDuration = 0
    let foundAnyDuration = false

    // Sum durations from ALL option groups
    product.options.forEach((optionGroup, groupIndex) => {
      const selectedIndex = selectedOptionIndices[groupIndex] ?? 0
      const selectedOption = optionGroup.options[selectedIndex]
      if (selectedOption?.duration && selectedOption.duration > 0) {
        totalDuration += selectedOption.duration
        foundAnyDuration = true
      }
    })

    // If no duration found in any option, return default
    return foundAnyDuration ? totalDuration : 60
  }

  // Check if product is already in cart (not applicable for prestations - they use time slot blocking instead)
  const isInCart = product
    ? product.category === 'prestations'
      ? false
      : cart.items.some(item => item.productId === product.id)
    : false

  // Extract prestation time slots from cart to block them in time pickers
  const cartPrestationSlots = isPrestationProduct
    ? cart.items
        .filter(item => item.category === 'prestations' && item.prestationStart && item.prestationEnd)
        .map(item => ({
          product_id: item.productId,
          prestation_start: new Date(item.prestationStart!).toISOString(),
          prestation_end: new Date(item.prestationEnd!).toISOString(),
        }))
    : []

  const handleAddToCart = () => {
    if (!product) return

    // For rental products, dates are required
    if (isRentalProduct && (!rentalPeriod?.from || !rentalPeriod?.to)) return

    // Build array of selected options (one per option group)
    const selectedOptions = product.options && product.options.length > 0
      ? product.options.map((optionGroup, groupIndex) => {
          const selectedIndex = selectedOptionIndices[groupIndex] ?? 0
          const option = optionGroup.options[selectedIndex]
          return {
            option_type_name: optionGroup.option_type_name,
            name: option.name,
            description: option.description,
            additional_fee: option.additional_fee,
          }
        })
      : undefined

    // For prestations (except henne-boutique): add number of people to personalizations
    const finalPersonalizations = isPrestationProduct
      ? {
          ...personalizationValues,
          ...(!isHenneBoutique && numberOfPeople ? { 'Nombre de personnes': numberOfPeople } : {})
        }
      : (Object.keys(personalizationValues).length > 0 ? personalizationValues : undefined)

    // For purchase and prestation products, use dummy dates (not displayed or used)
    const finalFrom = (isPurchaseProduct || isPrestationProduct) ? new Date() : rentalPeriod!.from!
    const finalTo = (isPurchaseProduct || isPrestationProduct) ? new Date() : rentalPeriod!.to!

    // Calculate prestationStart and prestationEnd for prestation items
    let prestationStart: Date | undefined
    let prestationEnd: Date | undefined

    if (isPrestationProduct && prestationDate) {
      if (isHenneBoutique && prestationTime) {
        // Henné en boutique: heure flexible
        const [hours, minutes] = prestationTime.split(':').map(Number)
        prestationStart = new Date(prestationDate)
        prestationStart.setHours(hours, minutes, 0, 0)

        const duration = getTotalPrestationDuration()
        prestationEnd = new Date(prestationStart)
        prestationEnd.setMinutes(prestationEnd.getMinutes() + duration)
      } else if (isHenneDomicile && prestationSlot) {
        // Henné à domicile: créneau fixe
        const { start, end } = getSlotTimes(prestationSlot, prestationDate)
        prestationStart = start
        prestationEnd = end
      }
    }

    addToCart({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0],
      quantity: isHenneBoutique ? 1 : quantity, // Force quantity = 1 for henne-boutique only (prix fixe)
      numberOfPeople: isPrestationProduct && !isHenneBoutique && numberOfPeople ? parseInt(numberOfPeople) : undefined,
      pricePerUnit: getEffectivePrice(),
      selectedOptions,
      personalizations: finalPersonalizations,
      installationFees: product.installation_fees || undefined,
      needsInstallation,
      rentalPeriod: {
        from: finalFrom,
        to: finalTo,
      },
      startTime,
      endTime,
      prestationStart: isPrestationProduct ? prestationStart : undefined,
      prestationEnd: isPrestationProduct ? prestationEnd : undefined,
      category: product.category,
      subcategory: product.subcategory,
    })

    // Redirect to cart page
    router.push('/panier')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="spinner"></div>
        </div>

        <style jsx>{`
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e7e5e4;
            border-top-color: #000000;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
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
                ...breadcrumbItems,
                { label: product.name, href: `${breadcrumbItems[breadcrumbItems.length - 1].href}/${product.slug}` }
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
                  <h1 className="text-3xl md:text-4xl font-bold text-black mb-3 md:mb-4">
                    {product.name}
                  </h1>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <p className={`text-2xl md:text-3xl font-bold ${product.new_price ? 'text-red-600' : 'text-black'}`}>
                        {getTotalPrice().toFixed(2)} €
                      </p>
                      {product.new_price && (
                        <p className="text-l md:text-xl text-stone-500 line-through">
                          {(product.price + getTotalOptionsFees()).toFixed(2)} €
                        </p>
                      )}
                    </div>
                    {getTotalOptionsFees() > 0 && (
                      <p className="text-sm text-stone-600 mt-1">
                        Prix de base: {getEffectivePrice().toFixed(2)} € + Options: {getTotalOptionsFees().toFixed(2)} €
                      </p>
                    )}
                  </div>
                  <p className="text-stone-600 mt-2">
                    {isRentalProduct && 'Prix de location'}
                    {isPurchaseProduct && "Prix d'achat"}
                    {isPrestationProduct && 'Prix de la prestation'}
                  </p>
                </div>

                {/* Onglets Description / FAQ */}
                {(product.description || (product.faq && product.faq.length > 0)) && (
                  <div className="border-t border-stone-200 pt-6">
                    {/* Tabs Header */}
                    {product.faq && product.faq.length > 0 && (
                      <div className="flex border-b border-stone-200 mb-4">
                        <button
                          onClick={() => setActiveTab('description')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'description'
                              ? 'text-black border-b-2 border-black'
                              : 'text-stone-500 hover:text-stone-700'
                          }`}
                        >
                          Description
                        </button>
                        <button
                          onClick={() => setActiveTab('faq')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'faq'
                              ? 'text-black border-b-2 border-black'
                              : 'text-stone-500 hover:text-stone-700'
                          }`}
                        >
                          FAQ
                        </button>
                      </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'description' && (
                      <>
                        {product.description && (
                          <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-3">Description</h2>
                            <div
                              className="text-stone-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(product.description) }}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {activeTab === 'faq' && product.faq && product.faq.length > 0 && (
                      <div className="space-y-3">
                        {product.faq.map((faqItem, index) => (
                          <div
                            key={index}
                            className="border border-stone-200 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaqIndex(expandedFaqIndex === index ? null : index)}
                              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-stone-50 transition-colors"
                            >
                              <span className="font-medium text-black pr-4">
                                {faqItem.question}
                              </span>
                              <svg
                                className={`w-5 h-5 text-stone-600 transition-transform flex-shrink-0 ${
                                  expandedFaqIndex === index ? 'transform rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                            {expandedFaqIndex === index && (
                              <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 animate-fade-in">
                                <p className="text-stone-700 leading-relaxed">
                                  {faqItem.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Options selector - Multiple option groups */}
                {product.options && product.options.length > 0 && (
                  <div className="border-t border-stone-200 pt-6 space-y-6">
                    {product.options.map((optionGroup, groupIndex) => (
                      <div key={groupIndex}>
                        <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>
                          {optionGroup.option_type_name}
                        </h2>
                        <div className="space-y-3">
                          {optionGroup.options.map((option, optionIndex) => {
                            const isSelected = (selectedOptionIndices[groupIndex] ?? 0) === optionIndex
                            return (
                              <label
                                key={optionIndex}
                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-black bg-stone-50'
                                    : 'border-stone-200 hover:border-stone-300'
                                } ${isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name={`product-option-group-${groupIndex}`}
                                  value={optionIndex}
                                  checked={isSelected}
                                  onChange={() => {
                                    if (!isInCart) {
                                      setSelectedOptionIndices(prev => ({
                                        ...prev,
                                        [groupIndex]: optionIndex,
                                      }))
                                    }
                                  }}
                                  disabled={isInCart}
                                  className="mr-3 flex-shrink-0"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1 gap-2">
                                    <span className="font-medium text-black">{option.name}</span>
                                    {option.additional_fee > 0 && (
                                      <span className="text-sm font-semibold text-black">
                                        +{option.additional_fee.toFixed(0)}€
                                      </span>
                                    )}
                                  </div>
                                  {option.description && (
                                    <p className="text-sm text-stone-600">{option.description}</p>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Personalization fields */}
                {product.personalizations && product.personalizations.length > 0 && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>
                      Personnalisation
                    </h2>
                    <div className="space-y-4">
                      {product.personalizations.map((fieldLabel, index) => (
                        <div key={index}>
                          <label htmlFor={`personalization-${index}`} className={`block text-sm font-medium mb-2 ${isInCart ? 'text-stone-400' : 'text-stone-700'}`}>
                            {fieldLabel}
                          </label>
                          <input
                            id={`personalization-${index}`}
                            type="text"
                            value={personalizationValues[fieldLabel] || ''}
                            onChange={(e) => {
                              if (!isInCart) {
                                setPersonalizationValues(prev => ({
                                  ...prev,
                                  [fieldLabel]: e.target.value,
                                }))
                              }
                            }}
                            disabled={isInCart}
                            placeholder={`Entrez ${fieldLabel.toLowerCase()}`}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                              isInCart
                                ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
                                : 'border-stone-300 bg-white'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Installation service option */}
                {product.installation_fees && product.installation_fees > 0 && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Service d&apos;installation</h2>
                    <label
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        needsInstallation
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-stone-200 hover:border-stone-300'
                      } ${isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={needsInstallation}
                        onChange={(e) => setNeedsInstallation(e.target.checked)}
                        disabled={isInCart}
                        className="mt-1 w-5 h-5 text-blue-600 border-stone-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-black">
                          Aide à l&apos;installation (+{product.installation_fees}€ / unité)
                        </div>
                        <p className="text-sm text-stone-600 mt-1">
                          Notre équipe vous accompagne dans l&apos;installation de votre location.
                        </p>
                        {needsInstallation && (
                          <p className="text-sm font-medium text-blue-700 mt-2">
                            Total frais d&apos;installation : {(product.installation_fees * quantity).toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                )}


                <div className="border-t border-stone-200 pt-6">
                  {isInCart && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Ce produit est déjà dans votre panier.
                      </p>
                      <p className="text-sm text-blue-700">
                        <Link href="/panier" className="underline font-semibold hover:text-blue-900">
                          Voir mon panier
                        </Link>
                      </p>
                    </div>
                  )}
                  {/* Champ différent selon le type de produit */}
                  {isPrestationProduct && !isHenneBoutique ? (
                    /* Champ texte simple pour les prestations hors boutique (information uniquement) */
                    <div className="mb-4">
                      <label htmlFor="numberOfPeople" className={`text-lg font-semibold block mb-2 ${isInCart ? 'text-stone-400' : ''}`}>
                        Nombre de personnes
                      </label>
                      <input
                        id="numberOfPeople"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={numberOfPeople}
                        disabled={isInCart}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setNumberOfPeople(value)
                        }}
                        placeholder="Ex: 5 (optionnel)"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                          isInCart ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed' : 'border-stone-300'
                        }`}
                      />
                      <p className="text-sm text-stone-500 mt-1">
                        Cette information nous aide à mieux préparer la prestation (le prix reste fixe)
                      </p>
                    </div>
                  ) : isPrestationProduct ? null : (
                    /* Sélecteur de quantité classique pour locations et achats */
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <label htmlFor="quantity" className={`text-lg font-semibold ${isInCart ? 'text-stone-400' : ''}`}>
                          Quantité :
                        </label>
                        <div className={`flex items-center border rounded-lg ${isInCart ? 'border-stone-200 bg-stone-50' : 'border-stone-300'}`}>
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={isInCart}
                            className="px-4 py-2 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Diminuer la quantité"
                          >
                            -
                          </button>
                          <input
                            id="quantity"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={quantity === 0 ? '' : quantity}
                            disabled={isInCart}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '')
                              if (value === '') {
                                setQuantity(0)
                              } else {
                                // No stock limit for purchases
                                if (isPurchaseProduct) {
                                  setQuantity(parseInt(value))
                                } else {
                                  setQuantity(Math.min(product.stock, parseInt(value)))
                                }
                              }
                            }}
                            onBlur={() => {
                              if (quantity === 0 || quantity < 1) {
                                setQuantity(1)
                              }
                            }}
                            className="w-16 text-center border-x border-stone-300 py-2 focus:outline-none disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => {
                              // No stock limit for purchases
                              if (isPurchaseProduct) {
                                setQuantity(quantity + 1)
                              } else {
                                setQuantity(Math.min(product.stock, quantity + 1))
                              }
                            }}
                            disabled={isInCart}
                            className="px-4 py-2 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            aria-label="Augmenter la quantité"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range Picker - Only for rental products */}
                {isRentalProduct && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Période de location</h2>
                    <p className={`text-sm mb-4 ${isInCart ? 'text-stone-400' : 'text-stone-600'}`}>
                      Sélectionnez une date de début et une date de fin pour votre location
                    </p>
                    <DateRangePicker
                      unavailabilities={product.unavailabilities}
                      stock={product.stock}
                      requestedQuantity={quantity}
                      selectedRange={rentalPeriod}
                      onRangeSelect={setRentalPeriod}
                      startTime={startTime}
                      endTime={endTime}
                      onTimeChange={(start, end) => {
                        setStartTime(start)
                        setEndTime(end)
                      }}
                      disabled={isInCart}
                    />
                    {rentalPeriod?.from && rentalPeriod?.to && (
                      <div className={`mt-4 p-4 rounded-lg ${isInCart ? 'bg-stone-100' : 'bg-stone-50'}`}>
                        <p className={`text-sm font-medium ${isInCart ? 'text-stone-400' : ''}`}>
                          Période sélectionnée :
                          <span className={`ml-2 ${isInCart ? 'text-stone-500' : 'text-black'}`}>
                            {rentalPeriod.from.toLocaleDateString('fr-FR')} {startTime} - {rentalPeriod.to.toLocaleDateString('fr-FR')} {endTime}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Prestation Date Picker - Only for prestation products */}
                {isPrestationProduct && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Date de la prestation</h2>
                    <p className={`text-sm mb-4 ${isInCart ? 'text-stone-400' : 'text-stone-600'}`}>
                      Sélectionnez la date de votre prestation
                    </p>
                    <PrestationDatePicker
                      selectedDate={prestationDate}
                      onDateChange={setPrestationDate}
                      disabled={isInCart}
                    />

                    {isHenneBoutique && (
                      <>
                        <h2 className={`text-xl font-semibold mt-6 mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Heure de la prestation</h2>
                        <p className={`text-sm mb-4 ${isInCart ? 'text-stone-400' : 'text-stone-600'}`}>
                          Choisissez l&apos;heure de début
                        </p>
                        <TimePickerBoutique
                          selectedDate={prestationDate}
                          selectedTime={prestationTime}
                          duration={getTotalPrestationDuration()}
                          onTimeChange={setPrestationTime}
                          onConflictChange={setPrestationTimeConflict}
                          disabled={isInCart}
                          cartUnavailabilities={cartPrestationSlots}
                        />
                      </>
                    )}

                    {isHenneDomicile && (
                      <>
                        <h2 className={`text-xl font-semibold mt-6 mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Créneau horaire</h2>
                        <p className={`text-sm mb-4 ${isInCart ? 'text-stone-400' : 'text-stone-600'}`}>
                          Sélectionnez un créneau
                        </p>
                        <TimeSlotPickerFixed
                          selectedDate={prestationDate}
                          selectedSlot={prestationSlot}
                          onSlotChange={setPrestationSlot}
                          disabled={isInCart}
                          cartUnavailabilities={cartPrestationSlots}
                        />
                      </>
                    )}
                  </div>
                )}

                <div className="border-t border-stone-200 pt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      (isRentalProduct && (!rentalPeriod?.from || !rentalPeriod?.to)) ||
                      (isPrestationProduct && isHenneBoutique && (!prestationDate || !prestationTime || prestationTimeConflict)) ||
                      (isPrestationProduct && isHenneDomicile && (!prestationDate || !prestationSlot)) ||
                      (isPrestationProduct && !isHenneBoutique && !isHenneDomicile && !prestationDate) ||
                      isInCart
                    }
                    className="w-full bg-black text-white px-8 py-4 rounded-lg hover:bg-stone-800 transition-colors text-lg font-medium disabled:bg-stone-300 disabled:cursor-not-allowed"
                  >
                    {isInCart ? 'Produit déjà dans le panier' : 'Ajouter au panier'}
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
