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
    if (!productData.id) {
      return NextResponse.json(
        { error: 'ID du produit manquant' },
        { status: 400 }
      )
    }

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

    // Extract ID and remove it from update data
    const { id, ...updateData } = productData

    // Update product in database
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur mise à jour produit:', updateError)
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour du produit: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Produit introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Produit mis à jour avec succès',
      product
    })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du produit' },
      { status: 500 }
    )
  }
}
