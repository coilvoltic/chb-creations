import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// GET /api/admin/tags - Récupérer tous les tags
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tags', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tags - Créer un nouveau tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du tag est requis' },
        { status: 400 }
      )
    }

    if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-F]{6}$/i)) {
      return NextResponse.json(
        { error: 'La couleur doit être au format hexadécimal (ex: #EF4444)' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({ name: name.trim(), color: color.toUpperCase() })
      .select()
      .single()

    if (error) {
      // Vérifier si c'est une erreur de doublon
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Un tag avec ce nom existe déjà' },
          { status: 409 }
        )
      }
      console.error('Error creating tag:', error)
      return NextResponse.json(
        { error: 'Failed to create tag', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
