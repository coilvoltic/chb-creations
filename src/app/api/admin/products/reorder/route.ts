import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ReorderItem {
  id: number
  display_order: number
}

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

    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { items }: { items: ReorderItem[] } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Liste de produits invalide' },
        { status: 400 }
      )
    }

    // Batch update all display_order values
    const updates = items.map(({ id, display_order }) =>
      supabase
        .from('products')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updates)

    const failed = results.filter((r) => r.error)
    if (failed.length > 0) {
      console.error('Erreurs lors du réordonnancement:', failed.map((r) => r.error))
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de certains produits' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Ordre mis à jour avec succès' })
  } catch (error) {
    console.error('Erreur API reorder:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
