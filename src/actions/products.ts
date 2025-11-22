'use server'

import type { Product } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

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
      .from('products')
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

export async function getTronesProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('subcategory', 'trones')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching trones products:', error.message)
      return []
    }

    return (data as Product[]) || []
  } catch (err) {
    console.error('Exception fetching trones products:', err)
    return []
  }
}

export async function getDecoEtAccessoiresProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('subcategory', 'deco-et-accessoires')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching deco et accessoires products:', error.message)
      return []
    }

    return (data as Product[]) || []
  } catch (err) {
    console.error('Exception fetching deco et accessoires products:', err)
    return []
  }
}

export async function getTenuesHommeProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('subcategory', 'tenues-homme')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tenues homme products:', error.message)
      return []
    }

    return (data as Product[]) || []
  } catch (err) {
    console.error('Exception fetching tenues homme products:', err)
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching product by slug:', error.message)
      return null
    }

    const product = data as Product

    // Fetch unavailabilities dynamically using the SQL function
    const { data: unavailabilities, error: unavailError } = await supabase.rpc(
      'get_product_unavailabilities',
      { product_id_param: product.id }
    )

    if (unavailError) {
      console.error('Error fetching unavailabilities:', unavailError.message)
    }

    // Attach unavailabilities to the product
    product.unavailabilities = unavailabilities || []

    return product
  } catch (err) {
    console.error('Exception fetching product by slug:', err)
    return null
  }
}
