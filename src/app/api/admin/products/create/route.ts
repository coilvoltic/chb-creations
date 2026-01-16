import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Check authentication
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const productData = await request.json()

    // Validate required fields
    if (!productData.name || !productData.slug || !productData.price || !productData.category || !productData.subcategory || productData.stock === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    if (!productData.images || productData.images.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une image est requise' },
        { status: 400 }
      )
    }

    // Insert product into database
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (insertError) {
      console.error('Erreur insertion produit:', insertError)
      return NextResponse.json(
        { error: `Erreur lors de la création du produit: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Produit créé avec succès',
      product
    })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du produit' },
      { status: 500 }
    )
  }
}
