import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Chercher le cookie d'authentification Supabase (le nom varie selon le projet)
    const allCookies = cookieStore.getAll()
    const authCookie = allCookies.find(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Non authentifié - aucun cookie d\'auth trouvé' }, { status: 401 })
    }

    // Parser le cookie qui contient un objet JSON avec le token
    let accessToken: string
    try {
      const parsed = JSON.parse(authCookie.value)
      accessToken = parsed.access_token || parsed[0]
    } catch {
      // Si le parsing échoue, utiliser la valeur directement
      accessToken = authCookie.value
    }

    // Créer un client Supabase avec le service role key pour l'admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Obtenir la session utilisateur avec le token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json({
        error: 'Non authentifié - token invalide',
        details: userError?.message
      }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { user_email: user.email })

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

    // Pour chaque commande, récupérer ses rental_reservations, purchase_reservations ET prestation_reservations
    const ordersWithReservations = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: rentalReservations } = await supabase
          .from('rental_reservations')
          .select('*')
          .eq('customer_order_id', order.id)

        const { data: purchaseReservations } = await supabase
          .from('purchase_reservations')
          .select('*')
          .eq('customer_order_id', order.id)

        const { data: prestationReservations } = await supabase
          .from('prestation_reservations')
          .select('*')
          .eq('customer_order_id', order.id)

        return {
          ...order,
          rental_reservations: rentalReservations || [],
          purchase_reservations: purchaseReservations || [],
          prestation_reservations: prestationReservations || [],
        }
      })
    )

    return NextResponse.json({ orders: ordersWithReservations })
  } catch (error) {
    console.error('Erreur API admin/reservations:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
