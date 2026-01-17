import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Vérifier l'authentification
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer l'ID du produit depuis la query string
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID du produit requis' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name, images')
      .eq('id', productId)
      .single()

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le produit de la base de données
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      console.error('Erreur suppression produit:', deleteError)
      return NextResponse.json(
        { error: `Erreur lors de la suppression du produit: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Optionnel : Supprimer les images du storage
    // Note: Pour l'instant on garde les images dans le storage même après suppression du produit
    // pour éviter les erreurs si d'autres produits utilisent les mêmes images
    // Si vous voulez supprimer les images, décommentez le code ci-dessous:
    /*
    if (existingProduct.images && existingProduct.images.length > 0) {
      for (const imageUrl of existingProduct.images) {
        try {
          // Extraire le chemin du fichier depuis l'URL
          const urlParts = imageUrl.split('/chb-creations-products/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            await supabase.storage
              .from('chb-creations-products')
              .remove([filePath])
          }
        } catch (err) {
          console.error('Erreur suppression image:', err)
          // On continue même si la suppression d'image échoue
        }
      }
    }
    */

    return NextResponse.json({
      message: 'Produit supprimé avec succès',
      product: existingProduct
    })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du produit' },
      { status: 500 }
    )
  }
}
