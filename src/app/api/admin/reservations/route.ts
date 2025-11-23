import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    // Mettre à jour les réservations passées à DONE
    // Une réservation est considérée comme passée si rental_end de tous ses items est dépassé
    const { error: updateError } = await supabase.rpc('update_past_reservations_to_done')

    if (updateError) {
      console.error('Erreur mise à jour réservations passées:', updateError)
      // Ne pas bloquer si l'update échoue, continuer avec la récupération
    }

    // Récupérer toutes les commandes avec leurs sous-réservations
    const { data: orders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Pour chaque commande, récupérer ses rental_reservations
    const ordersWithReservations = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: rentalReservations } = await supabase
          .from('rental_reservations')
          .select('*')
          .eq('customer_order_id', order.id)

        return {
          ...order,
          rental_reservations: rentalReservations || [],
        }
      })
    )

    return NextResponse.json({ orders: ordersWithReservations })
  } catch (error) {
    console.error('Erreur API admin/reservations:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
