import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { user_email: session.user.email })

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer la réservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (reservationError) {
      console.error('Erreur récupération réservation:', reservationError)
      return NextResponse.json({ error: reservationError.message }, { status: 500 })
    }

    if (!reservation) {
      console.error('Réservation non trouvée:', id)
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    console.log('Réservation trouvée:', reservation.id)

    // Récupérer les items de la réservation avec les informations produit
    const { data: items, error: itemsError } = await supabase
      .from('reservation_items')
      .select(`
        *,
        products (
          name,
          slug,
          images
        )
      `)
      .eq('reservation_id', id)
      .order('id', { ascending: true })

    if (itemsError) {
      console.error('Erreur récupération items:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    console.log('Items trouvés:', items?.length || 0)

    return NextResponse.json({ reservation, items })
  } catch (error) {
    console.error('Erreur API admin/reservations/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
