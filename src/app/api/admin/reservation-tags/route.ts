import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// POST /api/admin/reservation-tags - Associer un tag à une réservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tag_id,
      rental_reservation_id,
      purchase_reservation_id,
      prestation_reservation_id
    } = body

    // Validation
    if (!tag_id || typeof tag_id !== 'number') {
      return NextResponse.json(
        { error: 'tag_id est requis et doit être un nombre' },
        { status: 400 }
      )
    }

    // Vérifier qu'exactement une des trois FK est fournie
    const reservationIds = [
      rental_reservation_id,
      purchase_reservation_id,
      prestation_reservation_id
    ].filter(id => id !== undefined && id !== null)

    if (reservationIds.length !== 1) {
      return NextResponse.json(
        { error: 'Exactement un type de réservation doit être fourni' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const insertData: {
      tag_id: number
      rental_reservation_id?: number
      purchase_reservation_id?: number
      prestation_reservation_id?: number
    } = { tag_id }

    if (rental_reservation_id) insertData.rental_reservation_id = rental_reservation_id
    if (purchase_reservation_id) insertData.purchase_reservation_id = purchase_reservation_id
    if (prestation_reservation_id) insertData.prestation_reservation_id = prestation_reservation_id

    const { data: reservationTag, error } = await supabase
      .from('reservation_tags')
      .insert(insertData)
      .select(`
        *,
        tag:tags(*)
      `)
      .single()

    if (error) {
      // Vérifier si c'est une erreur de doublon
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ce tag est déjà associé à cette réservation' },
          { status: 409 }
        )
      }
      console.error('Error creating reservation tag:', error)
      return NextResponse.json(
        { error: 'Failed to create reservation tag', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ reservationTag }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
