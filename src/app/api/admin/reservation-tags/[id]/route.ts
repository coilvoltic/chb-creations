import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// DELETE /api/admin/reservation-tags/[id] - Supprimer l'association d'un tag à une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservationTagId = parseInt(id)
    if (isNaN(reservationTagId)) {
      return NextResponse.json(
        { error: 'Invalid reservation tag ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await supabase
      .from('reservation_tags')
      .delete()
      .eq('id', reservationTagId)

    if (error) {
      console.error('Error deleting reservation tag:', error)
      return NextResponse.json(
        { error: 'Failed to delete reservation tag', details: error.message },
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
