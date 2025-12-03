import { getSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const date = searchParams.get('date') // Format: YYYY-MM-DD

  if (!productId || !date) {
    return NextResponse.json(
      { error: 'Missing productId or date parameter' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseClient()

    // Appeler la fonction SQL pour récupérer les créneaux indisponibles
    const { data, error } = await supabase.rpc('get_prestation_unavailable_slots', {
      product_id_param: parseInt(productId),
      date_param: date,
    })

    if (error) {
      console.error('Error fetching unavailable slots:', error)
      return NextResponse.json(
        { error: 'Failed to fetch unavailable slots' },
        { status: 500 }
      )
    }

    // Retourner un tableau de créneaux (time_slot strings)
    const unavailableSlots = (data || []).map((item: { time_slot: string }) => item.time_slot)

    return NextResponse.json({ unavailableSlots })
  } catch (error) {
    console.error('Error in prestation-unavailable-slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
