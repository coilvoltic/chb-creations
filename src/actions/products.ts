'use server'

import type { Product, ProductListing } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
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
      .order('display_order', { ascending: true, nullsFirst: false })
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

/**
 * Lightweight fetch for listing pages — only fields needed for product grids
 * Avoids fetching heavy JSONB fields (description, options, faq, personalizations)
 */
export async function getProductsForListing(
  subcategory: string,
  category?: string
): Promise<ProductListing[]> {
  try {
    const supabase = getSupabaseClient()

    let query = supabase
      .from('products')
      .select('id, name, slug, price, new_price, images, is_out_of_stock, category, subcategory')
      .eq('subcategory', subcategory)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching listing products for subcategory "${subcategory}":`, error.message)
      return []
    }

    return (data as ProductListing[]) || []
  } catch (err) {
    console.error(`Exception fetching listing products for subcategory "${subcategory}":`, err)
    return []
  }
}

export async function getArtDeTableProducts(): Promise<ProductListing[]> {
  return getProductsForListing('art-de-table', 'locations')
}

export async function getTronesProducts(): Promise<ProductListing[]> {
  return getProductsForListing('trones', 'locations')
}

export async function getDecoEtAccessoiresProducts(): Promise<ProductListing[]> {
  return getProductsForListing('deco-et-accessoires', 'locations')
}

export async function getBougiesProducts(): Promise<ProductListing[]> {
  return getProductsForListing('bougies', 'accessoires-personnalises')
}

export async function getCertificatsMariageProducts(): Promise<ProductListing[]> {
  return getProductsForListing('certificats-mariage', 'accessoires-personnalises')
}

export async function getCoussinsProducts(): Promise<ProductListing[]> {
  return getProductsForListing('coussins', 'accessoires-personnalises')
}

export async function getTableauxProducts(): Promise<ProductListing[]> {
  return getProductsForListing('tableaux', 'accessoires-personnalises')
}

export async function getTextileProducts(): Promise<ProductListing[]> {
  return getProductsForListing('textile', 'accessoires-personnalises')
}

export async function getBendirProducts(): Promise<ProductListing[]> {
  return getProductsForListing('bendir', 'accessoires-personnalises')
}

export async function getFairePartsProducts(): Promise<ProductListing[]> {
  return getProductsForListing('faire-parts', 'accessoires-personnalises')
}

export async function getOeufsProducts(): Promise<ProductListing[]> {
  return getProductsForListing('oeufs', 'accessoires-personnalises')
}

export const getProductBySlug = cache(async function getProductBySlug(slug: string, subcategory?: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseClient()

    let query = supabase
      .from('products')
      .select('*')
      .eq('slug', slug)

    // If subcategory is provided, use it to filter (disambiguate products with same slug)
    if (subcategory) {
      query = query.eq('subcategory', subcategory)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Error fetching product by slug:', error.message)
      return null
    }

    const product = data as Product

    // Fetch unavailabilities using service_role to bypass RLS on rental_reservations
    const serviceClient = getSupabaseServiceClient()

    const { data: unavailabilities, error: unavailError } = await serviceClient.rpc(
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
      const { data: prestationSlots, error: slotsError } = await serviceClient.rpc(
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
})

// Prestations henné
export async function getHenneBoutiqueProducts(): Promise<ProductListing[]> {
  return getProductsForListing('henne-boutique', 'prestations')
}

export async function getHenneDomicileProducts(): Promise<ProductListing[]> {
  return getProductsForListing('henne-domicile', 'prestations')
}
