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

    // Récupérer la commande client
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      console.error('Erreur récupération commande:', orderError)
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    console.log('Commande trouvée:', order.id)

    // Récupérer les rental_reservations de cette commande
    const { data: rentalReservations, error: reservationsError } = await supabase
      .from('rental_reservations')
      .select('*')
      .eq('customer_order_id', id)
      .order('id', { ascending: true })

    if (reservationsError) {
      console.error('Erreur récupération rental_reservations:', reservationsError)
      return NextResponse.json({ error: reservationsError.message }, { status: 500 })
    }

    console.log('Rental reservations trouvées:', rentalReservations?.length || 0)

    // Pour chaque rental_reservation, récupérer ses items
    const rentalReservationsWithItems = await Promise.all(
      (rentalReservations || []).map(async (reservation) => {
        const { data: items, error: itemsError } = await supabase
          .from('rental_items')
          .select(`
            *,
            products (
              name,
              slug,
              images
            )
          `)
          .eq('rental_reservation_id', reservation.id)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Erreur récupération rental_items:', itemsError)
        }

        return {
          ...reservation,
          items: items || [],
        }
      })
    )

    // Récupérer les purchase_reservations de cette commande
    const { data: purchaseReservations, error: purchaseError } = await supabase
      .from('purchase_reservations')
      .select('*')
      .eq('customer_order_id', id)
      .order('id', { ascending: true })

    if (purchaseError) {
      console.error('Erreur récupération purchase_reservations:', purchaseError)
    }

    console.log('Purchase reservations trouvées:', purchaseReservations?.length || 0)

    // Pour chaque purchase_reservation, récupérer ses items
    const purchaseReservationsWithItems = await Promise.all(
      (purchaseReservations || []).map(async (reservation) => {
        const { data: items, error: itemsError } = await supabase
          .from('purchase_items')
          .select(`
            *,
            products (
              name,
              slug,
              images
            )
          `)
          .eq('purchase_reservation_id', reservation.id)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Erreur récupération purchase_items:', itemsError)
        }

        return {
          ...reservation,
          items: items || [],
        }
      })
    )

    return NextResponse.json({
      order,
      rental_reservations: rentalReservationsWithItems,
      purchase_reservations: purchaseReservationsWithItems
    })
  } catch (error) {
    console.error('Erreur API admin/reservations/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
