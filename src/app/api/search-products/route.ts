import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, category, subcategory, images, price, new_price, is_out_of_stock')
    .ilike('name', `%${query}%`)
    .eq('is_out_of_stock', false)
    .order('name', { ascending: true })
    .limit(8)

  if (error) {
    console.error('Erreur recherche produits:', error)
    return NextResponse.json([])
  }

  return NextResponse.json(data || [], {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
