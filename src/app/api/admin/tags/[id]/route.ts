import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// PATCH /api/admin/tags/[id] - Modifier un tag
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id)
    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, color } = body

    // Validation
    const updates: { name?: string; color?: string } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Le nom du tag est requis' },
          { status: 400 }
        )
      }
      updates.name = name.trim()
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || !color.match(/^#[0-9A-F]{6}$/i)) {
        return NextResponse.json(
          { error: 'La couleur doit être au format hexadécimal (ex: #EF4444)' },
          { status: 400 }
        )
      }
      updates.color = color.toUpperCase()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune modification fournie' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: tag, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
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
      console.error('Error updating tag:', error)
      return NextResponse.json(
        { error: 'Failed to update tag', details: error.message },
        { status: 500 }
      )
    }

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tag })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tags/[id] - Supprimer un tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id)
    if (isNaN(tagId)) {
      return NextResponse.json(
        { error: 'Invalid tag ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Supprimer le tag (les associations seront supprimées automatiquement via ON DELETE CASCADE)
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json(
        { error: 'Failed to delete tag', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
