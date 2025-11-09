'use server'

import { createClient } from '@supabase/supabase-js'
import type { Product } from '@/lib/supabase'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export async function getArtDeTableProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('chb-creations-products-table')
      .select('*')
      .eq('subcategory', 'art-de-table')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching art de table products:', error.message)
      return []
    }

    return (data as Product[]) || []
  } catch (err) {
    console.error('Exception fetching art de table products:', err)
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('chb-creations-products-table')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching product by slug:', error.message)
      return null
    }

    return data as Product
  } catch (err) {
    console.error('Exception fetching product by slug:', err)
    return null
  }
}
