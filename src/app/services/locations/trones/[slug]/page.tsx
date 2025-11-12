'use client'

import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import DateRangePicker from '@/components/DateRangePicker'
import { useState, useEffect, use } from 'react'
import { getProductBySlug } from '@/actions/products'
import type { Product } from '@/lib/supabase'
import { notFound, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import type { DateRange } from 'react-day-picker'
import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
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
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)

  // Check if product is already in cart
  const isInCart = product ? cart.items.some(item => item.productId === product.id) : false

  // Get effective price (new_price if available, otherwise price)
  const getEffectivePrice = () => {
    if (!product) return 0
    return product.new_price ?? product.price
  }

  // Calculate total price with selected option
  const getTotalPrice = () => {
    if (!product) return 0
    const basePrice = getEffectivePrice()
    const optionFee = product.options && product.options.length > 0
      ? product.options[selectedOptionIndex]?.additional_fee || 0
      : 0
    return basePrice + optionFee
  }

  // Calculate deposit amount if applicable
  const getDepositAmount = () => {
    if (!product || !product.deposit) return 0
    return (getTotalPrice() * quantity * product.deposit) / 100
  }

  useEffect(() => {
    async function loadProduct() {
      const data = await getProductBySlug(slug)
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
  }, [slug])

  const handleAddToCart = () => {
    if (!product || !rentalPeriod?.from || !rentalPeriod?.to) return

    const selectedOption = product.options && product.options.length > 0
      ? product.options[selectedOptionIndex]
      : undefined

    addToCart({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0],
      quantity,
      pricePerUnit: getEffectivePrice(),
      selectedOption,
      depositPercentage: product.deposit || undefined,
      rentalPeriod: {
        from: rentalPeriod.from,
        to: rentalPeriod.to,
      },
      startTime,
      endTime,
      category: product.category,
      subcategory: product.subcategory,
    })

    // Redirect to cart page
    router.push('/panier')
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
                { label: 'Trônes', href: '/services/locations/trones' },
                { label: product.name, href: `/services/locations/trones/${product.slug}` }
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
                  <div>
                    <div className="flex items-baseline gap-3">
                      <p className={`text-3xl font-bold ${product.new_price ? 'text-red-600' : 'text-black'}`}>
                        {getTotalPrice().toFixed(2)} €
                      </p>
                      {product.new_price && (
                        <p className="text-xl text-stone-500 line-through">
                          {(product.price + (product.options && product.options.length > 0 ? product.options[selectedOptionIndex]?.additional_fee || 0 : 0)).toFixed(2)} €
                        </p>
                      )}
                    </div>
                    {product.options && product.options.length > 0 && product.options[selectedOptionIndex]?.additional_fee > 0 && (
                      <p className="text-sm text-stone-600 mt-1">
                        Prix de base: {getEffectivePrice().toFixed(2)} € + Option: {product.options[selectedOptionIndex].additional_fee.toFixed(2)} €
                      </p>
                    )}
                  </div>
                  <p className="text-stone-600 mt-2">
                    Prix de location
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
                            <div className="text-stone-700 leading-relaxed prose prose-stone max-w-none">
                              <ReactMarkdown>{product.description}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {product.features && product.features.length > 0 && (
                          <div className={product.description ? 'border-t border-stone-200 pt-6' : ''}>
                            <h2 className="text-xl font-semibold mb-3">Informations</h2>
                            <ul className="space-y-2 text-stone-700">
                              {product.features.map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                            </ul>
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

                {/* Options selector */}
                {product.options && product.options.length > 0 && (
                  <div className="border-t border-stone-200 pt-6">
                    <h2 className={`text-xl font-semibold mb-3 ${isInCart ? 'text-stone-400' : ''}`}>Options disponibles</h2>
                    <div className="space-y-3">
                      {product.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedOptionIndex === index
                              ? 'border-black bg-stone-50'
                              : 'border-stone-200 hover:border-stone-300'
                          } ${isInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name="product-option"
                            value={index}
                            checked={selectedOptionIndex === index}
                            onChange={() => !isInCart && setSelectedOptionIndex(index)}
                            disabled={isInCart}
                            className="mr-3 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1 gap-1 md:gap-2">
                              <span className="font-medium text-black">{option.name}</span>
                              {option.additional_fee > 0 && (
                                <span className="text-sm font-semibold text-black">
                                  +{option.additional_fee.toFixed(0)}€
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-stone-600">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deposit warning */}
                {product.deposit && product.deposit > 0 && (
                  <div className="border-t border-stone-200 pt-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-900 mb-1">
                            Acompte requis : {product.deposit}%
                          </p>
                          <p className="text-sm text-amber-800">
                            Un acompte de <strong>{getDepositAmount().toFixed(2)} €</strong> sera requis pour valider cette réservation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-6">
                  {isInCart && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        Ce produit est déjà dans votre panier
                      </p>
                      <p className="text-sm text-blue-700">
                        <Link href="/panier" className="underline font-semibold hover:text-blue-900">
                          Voir mon panier
                        </Link>
                      </p>
                    </div>
                  )}
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
                              setQuantity(Math.min(product.stock, parseInt(value)))
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
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={isInCart}
                          className="px-4 py-2 hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm ${isInCart ? 'text-stone-400' : 'text-stone-600'}`}>
                      {product.stock} en stock
                    </p>
                  </div>
                </div>

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

                <div className="border-t border-stone-200 pt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={!rentalPeriod?.from || !rentalPeriod?.to || isInCart}
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
