/**
 * Database types - Core Supabase table interfaces
 * Centralized type definitions for all database entities
 */

// ==================== ENUMS ====================

export type ReservationStatus = 'DONE' | 'CANCELLED' | 'CONFIRMED' | 'PENDING'

export type DeliveryOption = 'pickup' | 'delivery' | 'relay_point'

export type RelayProvider = 'chronopost' | 'mondialrelay'

// ==================== TAGS ====================

export interface Tag {
  id: number
  name: string
  color: string // Hex color code (e.g., #EF4444)
  created_at: string
}

export interface ReservationTag {
  id: number
  tag_id: number
  rental_reservation_id?: number
  purchase_reservation_id?: number
  prestation_reservation_id?: number
  created_at: string
  tag?: Tag // Relation virtuelle pour inclure les détails du tag
}

// ==================== CUSTOMER INFO ====================

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// ==================== PRODUCTS ====================

export interface UnavailabilityEntry {
  date: string // YYYY-MM-DD
  reserved_products: number
}

export interface PrestationUnavailableSlot {
  product_id: number
  prestation_start: string // ISO timestamp
  prestation_end: string // ISO timestamp
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ProductOption {
  name: string
  description?: string
  additional_fee: number
  duration?: number // Durée en minutes (pour prestations boutique uniquement)
}

export interface ProductOptionGroup {
  option_type_name: string
  options: ProductOption[]
}

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  new_price?: number // Promotional price (if set, display this instead of price)
  images: string[]
  description?: string
  faq?: FAQItem[]
  options?: ProductOptionGroup[] // Array of option groups (e.g., installation options, color options)
  personalizations?: string[] // Array of personalization field labels (e.g., ["Prénom", "Date de naissance"])
  is_out_of_stock?: boolean // True if product is out of stock
  installation_fees?: number // Optional installation fees
  category: string
  subcategory: string
  stock: number
  unavailabilities?: UnavailabilityEntry[] // For rental products (locations)
  prestationUnavailableSlots?: PrestationUnavailableSlot[] // For prestation products (henne)
  created_at?: string
}

// ==================== ORDERS & RESERVATIONS ====================

// Customer Order (parent table)
export interface CustomerOrder {
  id: number
  created_at: string
  order_number: string
  customer_infos: CustomerInfo
  total_price: number
  user_id?: string // Optional: Supabase Auth user ID if order placed while logged in
  promotional_code_id?: number // FK to promotional_codes
  promotional_code_name?: string // Snapshot of code name at order time
  promotional_code_discount?: number // Snapshot of discount percentage (0-100)
  notes?: string | null
  already_paid: number
}

// Rental Reservation (child of CustomerOrder)
export interface RentalReservation {
  id: number
  created_at: string
  customer_order_id: number
  total_price: number
  deposit?: number
  caution?: number
  reservation_status: ReservationStatus
  delivery_address?: string
  delivery_fees?: number
  tags?: Tag[] // Tags associés à cette réservation (relation via reservation_tags)
}

// Product option stored in rental/purchase/prestation items
export interface ItemOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
  duration?: number // Durée en minutes (pour prestations boutique uniquement)
}

// Rental Item (items in a rental reservation)
export interface RentalItem {
  id: number
  rental_reservation_id: number
  product_id: number
  rental_start: string // ISO timestamp
  rental_end: string // ISO timestamp
  quantity: number
  options?: ItemOption[] // JSONB with selected options
  personalizations?: Record<string, string>
  needs_installation?: boolean
}

// Purchase Reservation (child of CustomerOrder for purchase orders)
export interface PurchaseReservation {
  id: number
  created_at: string
  customer_order_id: number
  total_price: number
  reservation_status: ReservationStatus
  delivery_address?: string
  delivery_fees?: number
  tags?: Tag[] // Tags associés à cette réservation (relation via reservation_tags)
}

// Purchase Item (items in a purchase reservation)
export interface PurchaseItem {
  id: number
  purchase_reservation_id: number
  product_id: number
  estimated_delivery_date?: string
  quantity: number
  options?: ItemOption[] // Same structure as rental items
  personalizations?: Record<string, string>
}

// Prestation Reservation (child of CustomerOrder for henné services)
export interface PrestationReservation {
  id: number
  created_at: string
  customer_order_id: number
  total_price: number
  reservation_status: ReservationStatus
  delivery_address?: string
  delivery_fees?: number
  tags?: Tag[] // Tags associés à cette réservation (relation via reservation_tags)
}

// Prestation Item (items in a prestation reservation)
export interface PrestationItem {
  id: number
  prestation_reservation_id: number
  product_id: number
  prestation_start?: string // ISO timestamp (date + heure de début)
  prestation_end?: string // ISO timestamp (date + heure de fin)
  nb_of_people: number // Number of people for the prestation (default: 1)
  options?: ItemOption[] // Same structure as rental items
  personalizations?: Record<string, string>
}

// ==================== PROMOTIONAL CODES ====================

export interface PromotionalCode {
  id: number
  name: string // Code name (e.g., "NOEL2024")
  discount: number // Percentage (0-100)
  created_at?: string
}

export interface PromotionalMessage {
  id: number
  msg: string
  created_at?: string
}

// ==================== APP SETTINGS ====================

/** Un créneau horaire : début et fin au format "HH:MM" */
export interface BoutiqueTimeSlot {
  start: string // "HH:MM", e.g. "08:00"
  end: string   // "HH:MM", e.g. "20:00"
}

/** Horaires par défaut : plusieurs créneaux possibles (ex: 00:00-03:00 + 07:00-23:59) */
export interface BoutiqueHoursDefault {
  slots: BoutiqueTimeSlot[]
}

/** Exception pour une date spécifique : soit fermé, soit créneaux personnalisés */
export interface BoutiqueHoursException {
  date: string              // "YYYY-MM-DD"
  closed?: boolean
  slots?: BoutiqueTimeSlot[] // only if not closed
}

export interface AppSettings {
  boutique_hours_default: BoutiqueHoursDefault
  boutique_hours_exceptions: BoutiqueHoursException[]
}

// ==================== LEGACY TYPES ====================
// For backward compatibility - will be removed later

/** @deprecated Use RentalReservation instead */
export type Reservation = RentalReservation & { customer_infos: CustomerInfo }

/** @deprecated Use RentalItem instead */
export type ReservationItem = RentalItem & { reservation_id: number }

/** @deprecated Use ItemOption instead */
export interface RentalItemOption {
  name: string
  description: string
  additional_fee: number
  needsInstallation?: boolean
  installationFees?: number
}
