'use server'

import type { Product } from '@/types'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Generic function to fetch products by subcategory
 * Replaces 14 duplicate functions with a single reusable implementation
 * @param subcategory - The product subcategory to filter by
 * @param category - Optional category filter for additional validation
 * @returns Array of products matching the subcategory
 */
export async function getProductsBySubcategory(
  subcategory: string,
  category?: string
): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient()

    let query = supabase
      .from('products')
      .select('*')
      .eq('subcategory', subcategory)
      .order('created_at', { ascending: true })

    // Optional category filter
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching products for subcategory "${subcategory}":`, error.message)
      return []
    }

    return (data as Product[]) || []
  } catch (err) {
    console.error(`Exception fetching products for subcategory "${subcategory}":`, err)
    return []
  }
}

export async function getArtDeTableProducts(): Promise<Product[]> {
  return getProductsBySubcategory('art-de-table', 'locations')
}

export async function getTronesProducts(): Promise<Product[]> {
  return getProductsBySubcategory('trones', 'locations')
}

export async function getDecoEtAccessoiresProducts(): Promise<Product[]> {
  return getProductsBySubcategory('deco-et-accessoires', 'locations')
}

export async function getBougiesProducts(): Promise<Product[]> {
  return getProductsBySubcategory('bougies', 'accessoires-personnalises')
}

export async function getCertificatsMariageProducts(): Promise<Product[]> {
  return getProductsBySubcategory('certificats-mariage', 'accessoires-personnalises')
}

export async function getCoussinsProducts(): Promise<Product[]> {
  return getProductsBySubcategory('coussins', 'accessoires-personnalises')
}

export async function getTableauxProducts(): Promise<Product[]> {
  return getProductsBySubcategory('tableaux', 'accessoires-personnalises')
}

export async function getTextileProducts(): Promise<Product[]> {
  return getProductsBySubcategory('textile', 'accessoires-personnalises')
}

export async function getBendirProducts(): Promise<Product[]> {
  return getProductsBySubcategory('bendir', 'accessoires-personnalises')
}

export async function getFairePartsProducts(): Promise<Product[]> {
  return getProductsBySubcategory('faire-parts', 'accessoires-personnalises')
}

export async function getOeufsProducts(): Promise<Product[]> {
  return getProductsBySubcategory('oeufs', 'accessoires-personnalises')
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

    // Fetch unavailabilities dynamically using the SQL function (for rental products)
    const { data: unavailabilities, error: unavailError } = await supabase.rpc(
      'get_product_unavailabilities',
      { product_id_param: product.id }
    )

    if (unavailError) {
      console.error('Error fetching unavailabilities:', unavailError.message)
    }

    // Attach unavailabilities to the product
    product.unavailabilities = unavailabilities || []

    // For prestation products (henne), fetch ALL unavailable time slots (centralized)
    if (product.category === 'prestations') {
      const { data: prestationSlots, error: slotsError } = await supabase.rpc(
        'get_all_prestation_unavailabilities'
      )

      if (slotsError) {
        console.error('Error fetching prestation unavailable slots:', slotsError.message)
      }

      // Attach ALL prestation unavailable slots to the product (centralized across all products)
      product.prestationUnavailableSlots = prestationSlots || []
    }

    return product
  } catch (err) {
    console.error('Exception fetching product by slug:', err)
    return null
  }
}

export async function getHenneProducts(): Promise<Product[]> {
  return getProductsBySubcategory('henne', 'prestations')
}

export async function getPackHenneProducts(): Promise<Product[]> {
  return getProductsBySubcategory('pack-henne', 'prestations')
}
