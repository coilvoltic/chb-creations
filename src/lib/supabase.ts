import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export interface UnavailabilityEntry {
  date: string // YYYY-MM-DD
  reserved_products: number
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ProductOption {
  name: string
  description?: string
  additional_fee: number
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
  features?: string[]
  faq?: FAQItem[]
  options?: ProductOptionGroup[] // Array of option groups (e.g., installation options, color options)
  personalizations?: string[] // Array of personalization field labels (e.g., ["Prénom", "Date de naissance"])
  deposit?: number // Percentage (0-100) or null
  caution?: number // Fixed amount for security deposit (not charged unless damage/loss)
  is_out_of_stock?: boolean // True if product is out of stock
  base_delivery_fees?: number // Base delivery fees for this product
  installation_fees?: number // Optional installation fees
  category: string
  subcategory: string
  stock: number
  unavailabilities?: UnavailabilityEntry[]
  created_at?: string
}

// Enum for reservation status matching Supabase
export type ReservationStatus = 'DONE' | 'CANCELLED' | 'CONFIRMED' | 'CONFIRMED_NO_DEPOSIT'

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// New schema: Customer Order (parent table)
export interface CustomerOrder {
  id: number
  created_at: string
  order_number: number
  customer_infos: CustomerInfo
  total_price: number
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
}

// Product option stored in rental item
export interface RentalItemOption {
  name: string
  description: string
  additional_fee: number
  needsInstallation?: boolean
  installationFees?: number
}

// Rental Item (items in a rental reservation)
export interface RentalItem {
  id: number
  rental_reservation_id: number
  product_id: number
  rental_start: string // ISO timestamp
  rental_end: string // ISO timestamp
  quantity: number
  options?: RentalItemOption // JSONB with selected options and installation info
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
}

// Purchase Item (items in a purchase reservation)
export interface PurchaseItem {
  id: number
  purchase_reservation_id: number
  product_id: number
  estimated_delivery_date?: string
  quantity: number
  options?: RentalItemOption // Same structure as rental items
  personalizations?: Record<string, string>
}

// Legacy aliases for backward compatibility (will be removed later)
/** @deprecated Use RentalReservation instead */
export type Reservation = RentalReservation & { customer_infos: CustomerInfo }
/** @deprecated Use RentalItem instead */
export type ReservationItem = RentalItem & { reservation_id: number }

export interface PromotionalMessage {
  id: number
  msg: string
  created_at?: string
}

// Helper function to get product unavailabilities dynamically from reservation_items
export async function getProductUnavailabilities(
  productId: number
): Promise<UnavailabilityEntry[]> {
  const supabase = getSupabaseClient()

  // Call the SQL function get_product_unavailabilities
  const { data, error } = await supabase.rpc('get_product_unavailabilities', {
    product_id_param: productId,
  })

  if (error) {
    console.error('Error fetching unavailabilities:', error)
    return []
  }

  return (data || []) as UnavailabilityEntry[]
}

// Helper function to get promotional messages for carousel
export async function getPromotionalMessages(): Promise<PromotionalMessage[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('promotional_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching promotional messages:', error)
    return []
  }

  return data || []
}
