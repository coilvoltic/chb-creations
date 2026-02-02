import { createClient } from '@supabase/supabase-js'
import type {
  UnavailabilityEntry,
  PrestationUnavailableSlot,
  PromotionalMessage,
} from '@/types'

/**
 * Re-export all types from centralized types directory
 * This file maintains backward compatibility while types are migrated
 */
export type {
  // Database types
  Product,
  ProductOption,
  ProductOptionGroup,
  FAQItem,
  UnavailabilityEntry,
  PrestationUnavailableSlot,
  ReservationStatus,
  CustomerInfo,
  CustomerOrder,
  RentalReservation,
  RentalItem,
  PurchaseReservation,
  PurchaseItem,
  PrestationReservation,
  PrestationItem,
  ItemOption,
  PromotionalCode,
  PromotionalMessage,

  // Legacy types (deprecated)
  Reservation,
  ReservationItem,
  RentalItemOption,
} from '@/types'

// TimeSlot type and constants for backward compatibility
export type TimeSlot = 'LUNCH' | 'AFTERNOON' | 'EVENING'

export const TIME_SLOTS: TimeSlot[] = ['LUNCH', 'AFTERNOON', 'EVENING']

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  LUNCH: 'Déjeuner (12h-15h30)',
  AFTERNOON: 'Après-midi (16h-20h)',
  EVENING: 'Soirée (20h30-23h30)',
}

// Client-side Supabase client factory
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
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

// Helper function to get all prestation unavailabilities (centralized across all products)
export async function getAllPrestationUnavailabilities(): Promise<PrestationUnavailableSlot[]> {
  const supabase = getSupabaseClient()

  // Call the SQL function get_all_prestation_unavailabilities
  const { data, error } = await supabase.rpc('get_all_prestation_unavailabilities')

  if (error) {
    console.error('Error fetching prestation unavailabilities:', error)
    return []
  }

  return (data || []) as PrestationUnavailableSlot[]
}

// Helper function to check if a prestation time slot is available
export async function isPrestationSlotAvailable(
  startTime: string,
  endTime: string
): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('is_prestation_slot_available', {
    requested_start: startTime,
    requested_end: endTime,
  })

  if (error) {
    console.error('Error checking slot availability:', error)
    return false
  }

  return data === true
}
