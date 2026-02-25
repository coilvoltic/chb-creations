/**
 * API types - Request and response payloads for API routes
 */

import type { CustomerInfo, ItemOption } from './database'
import type { DeliveryInfo } from './cart'

// ==================== RESERVATION API ====================

export interface CartItemPayload {
  productId: number
  productName: string
  category: string // 'locations', 'accessoires-personnalises', or 'prestations'
  quantity: number
  numberOfPeople?: number // For prestation items (henné) - number of people
  pricePerUnit: number
  rentalStart: string // ISO timestamp (dummy for purchase/prestation items)
  rentalEnd: string // ISO timestamp (dummy for purchase/prestation items)
  prestationStart?: string // ISO timestamp for prestation start (date + heure de début)
  prestationEnd?: string // ISO timestamp for prestation end (date + heure de fin)
  selectedOptions?: ItemOption[] // Array of selected options
  personalizations?: Record<string, string> // Map of personalization field name to value
  needsInstallation?: boolean
  installationFees?: number
}

export interface PromoCodePayload {
  code: string
  discount: number // Percentage (0-100)
}

export interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  rentalDelivery?: DeliveryInfo // Delivery info for rental items
  purchaseDelivery?: DeliveryInfo // Delivery info for purchase items
  prestationDelivery?: DeliveryInfo // Delivery info for prestation items
  totalPrice: number
  promoCode?: PromoCodePayload // Promotional code if applied
  paymentMethod?: 'online' | 'cash' | null
  userId?: string // Optional: Supabase Auth user ID if logged in with Google
}

export interface CreateReservationResponse {
  success: boolean
  reservationNumber?: string
  error?: string
}

// ==================== DELIVERY API ====================

export interface CalculateDeliveryRequest {
  address: string
  category: 'locations' | 'accessoires-personnalises' | 'prestations'
}

export interface CalculateDeliveryResponse {
  success: boolean
  fees?: number
  distance?: number
  error?: string
}

// ==================== PROMO CODE API ====================

export interface ValidatePromoCodeRequest {
  code: string
}

export interface ValidatePromoCodeResponse {
  valid: boolean
  discount?: number
  error?: string
}

// ==================== CONTACT API ====================

export interface ContactFormPayload {
  name: string
  email: string
  subject: string
  message: string
}

export interface ContactFormResponse {
  success: boolean
  error?: string
}

// ==================== STRIPE API ====================

export interface CreateCheckoutSessionRequest {
  amount: number
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  rentalDelivery?: DeliveryInfo
  purchaseDelivery?: DeliveryInfo
  prestationDelivery?: DeliveryInfo
  totalPrice: number
  promoCode?: PromoCodePayload
  userId?: string
}

export interface CreateCheckoutSessionResponse {
  url?: string
  error?: string
}
