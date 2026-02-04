import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// DELETE /api/admin/reservation-tags/by-params - Supprimer l'association par paramètres
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tag_id')
    const reservationType = searchParams.get('reservation_type')
    const reservationId = searchParams.get('reservation_id')

    if (!tagId || !reservationType || !reservationId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    let query = supabase
      .from('reservation_tags')
      .delete()
      .eq('tag_id', parseInt(tagId))

    if (reservationType === 'rental') {
      query = query.eq('rental_reservation_id', parseInt(reservationId))
    } else if (reservationType === 'purchase') {
      query = query.eq('purchase_reservation_id', parseInt(reservationId))
    } else if (reservationType === 'prestation') {
      query = query.eq('prestation_reservation_id', parseInt(reservationId))
    } else {
      return NextResponse.json(
        { error: 'Type de réservation invalide' },
        { status: 400 }
      )
    }

    const { error } = await query

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
