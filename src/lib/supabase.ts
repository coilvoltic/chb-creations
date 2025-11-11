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

export interface Product {
  id: number
  name: string
  slug: string
  price: number
  images: string[]
  description?: string
  features?: string[]
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

export interface Reservation {
  id: number
  created_at: string
  customer_infos: CustomerInfo
  deposit: number
  caution: number
  reservation_status: ReservationStatus
  total_price?: number
}

export interface ReservationItem {
  id: number
  reservation_id: number
  product_id: number
  rental_start: string // ISO timestamp
  rental_end: string // ISO timestamp
  quantity: number
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
