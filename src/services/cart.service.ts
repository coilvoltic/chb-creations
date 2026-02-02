/**
 * Cart Service - Business logic for cart calculations
 * Extracted from CartContext for better testability and maintainability
 */

import type { CartItem, DeliveryInfo, PromoCode } from '@/types'
import { FINANCIAL_CONFIG } from '@/config/constants'

/**
 * Calculate totals for cart items
 */
export function calculateCartTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalPrice = items.reduce((sum, item) => {
    const basePrice = item.pricePerUnit

    // Calculate total options fees from all selected options
    const optionsFees = item.selectedOptions
      ? item.selectedOptions.reduce((fees, option) => fees + option.additional_fee, 0)
      : 0

    const installationFee = (item.needsInstallation && item.installationFees)
      ? item.installationFees
      : 0

    return sum + item.quantity * (basePrice + optionsFees + installationFee)
  }, 0)

  return {
    totalItems,
    totalPrice,
  }
}

/**
 * Filter cart items by category
 */
export function filterItemsByCategory(items: CartItem[], category: string): CartItem[] {
  return items.filter(item => item.category === category)
}

/**
 * Get rental (locations) items
 */
export function getRentalItems(items: CartItem[]): CartItem[] {
  return filterItemsByCategory(items, 'locations')
}

/**
 * Get purchase (accessoires-personnalises) items
 */
export function getPurchaseItems(items: CartItem[]): CartItem[] {
  return filterItemsByCategory(items, 'accessoires-personnalises')
}

/**
 * Get prestation (prestations) items
 */
export function getPrestationItems(items: CartItem[]): CartItem[] {
  return filterItemsByCategory(items, 'prestations')
}

/**
 * Calculate subtotal (before delivery and discounts)
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const basePrice = item.pricePerUnit
    const optionsFees = item.selectedOptions
      ? item.selectedOptions.reduce((fees, option) => fees + option.additional_fee, 0)
      : 0
    const installationFee = (item.needsInstallation && item.installationFees)
      ? item.installationFees
      : 0

    return sum + item.quantity * (basePrice + optionsFees + installationFee)
  }, 0)
}

/**
 * Calculate total delivery fees across all categories
 */
export function calculateTotalDeliveryFees(
  rentalDelivery: DeliveryInfo,
  purchaseDelivery: DeliveryInfo,
  prestationDelivery: DeliveryInfo
): number {
  let total = 0

  // Only add delivery fees if delivery option is selected
  if (rentalDelivery.option === 'delivery' || rentalDelivery.option === 'relay_point') {
    total += rentalDelivery.fees
  }
  if (purchaseDelivery.option === 'delivery' || purchaseDelivery.option === 'relay_point') {
    total += purchaseDelivery.fees
  }
  if (prestationDelivery.option === 'delivery') {
    total += prestationDelivery.fees
  }

  return total
}

/**
 * Calculate discount amount based on promo code
 */
export function calculateDiscountAmount(subtotal: number, promoCode?: PromoCode): number {
  if (!promoCode) return 0
  return (subtotal * promoCode.discount) / 100
}

/**
 * Calculate final total (subtotal + delivery - discount)
 */
export function calculateFinalTotal(
  items: CartItem[],
  rentalDelivery: DeliveryInfo,
  purchaseDelivery: DeliveryInfo,
  prestationDelivery: DeliveryInfo,
  promoCode?: PromoCode
): number {
  const subtotal = calculateSubtotal(items)
  const deliveryFees = calculateTotalDeliveryFees(rentalDelivery, purchaseDelivery, prestationDelivery)
  const discount = calculateDiscountAmount(subtotal, promoCode)

  return subtotal + deliveryFees - discount
}

/**
 * Calculate deposit (acompte) - 50% of total order
 */
export function calculateDeposit(
  items: CartItem[],
  rentalDelivery: DeliveryInfo,
  purchaseDelivery: DeliveryInfo,
  prestationDelivery: DeliveryInfo,
  promoCode?: PromoCode
): number {
  const finalTotal = calculateFinalTotal(
    items,
    rentalDelivery,
    purchaseDelivery,
    prestationDelivery,
    promoCode
  )

  return finalTotal * FINANCIAL_CONFIG.depositPercentage
}

/**
 * Calculate caution (security deposit) - 50% of rental items only
 */
export function calculateCaution(items: CartItem[]): number {
  const rentalItems = getRentalItems(items)
  const rentalSubtotal = calculateSubtotal(rentalItems)

  return rentalSubtotal * FINANCIAL_CONFIG.cautionPercentage
}

/**
 * Validate cart item before adding
 */
export function validateCartItem(item: Omit<CartItem, 'id'>): {
  valid: boolean
  error?: string
} {
  // Check required fields
  if (!item.productId || !item.productName || !item.productSlug) {
    return { valid: false, error: 'Informations produit manquantes' }
  }

  if (!item.category || !item.subcategory) {
    return { valid: false, error: 'Catégorie manquante' }
  }

  if (item.quantity < 1) {
    return { valid: false, error: 'Quantité invalide' }
  }

  if (item.pricePerUnit < 0) {
    return { valid: false, error: 'Prix invalide' }
  }

  // Check rental period for rental products
  if (item.category === 'locations') {
    if (!item.rentalPeriod?.from || !item.rentalPeriod?.to) {
      return { valid: false, error: 'Période de location manquante' }
    }
  }

  // Check prestation date for prestation products
  if (item.category === 'prestations') {
    if (!item.prestationStart || !item.prestationEnd) {
      return { valid: false, error: 'Date de prestation manquante' }
    }
  }

  return { valid: true }
}

/**
 * Generate unique cart item ID
 */
export function generateCartItemId(productId: number): string {
  return `${productId}-${Date.now()}`
}

/**
 * Check if product is already in cart
 */
export function isProductInCart(items: CartItem[], productId: number): boolean {
  return items.some(item => item.productId === productId)
}
