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
