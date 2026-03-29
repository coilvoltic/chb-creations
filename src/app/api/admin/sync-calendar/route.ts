import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { syncCalendarForOrder } from '@/lib/google-calendar'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function POST() {
  // Vérifier l'authentification admin (même pattern que les autres routes admin)
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (!authCookie?.value) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  let accessToken: string
  try {
    const parsed = JSON.parse(authCookie.value)
    accessToken = parsed.access_token || parsed[0]
  } catch {
    accessToken = authCookie.value
  }
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
  if (userError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Requêter directement les réservations CONFIRMED depuis chaque table,
  // puis regrouper par customer_order pour appeler syncCalendarForOrder.
  const [
    { data: rentalRes, error: rentalErr },
    { data: purchaseRes, error: purchaseErr },
    { data: prestationRes, error: prestationErr },
  ] = await Promise.all([
    supabaseAdmin
      .from('rental_reservations')
      .select(`
        id,
        delivery_address,
        reservation_status,
        customer_order_id,
        customer_orders (id, order_number, customer_infos),
        rental_items (
          id,
          rental_start,
          rental_end,
          quantity,
          google_event_id,
          google_event_id_return,
          products (name)
        )
      `)
      .eq('reservation_status', 'CONFIRMED'),
    supabaseAdmin
      .from('purchase_reservations')
      .select(`
        id,
        delivery_address,
        reservation_status,
        google_event_id,
        customer_order_id,
        customer_orders (id, order_number, customer_infos),
        purchase_items (
          estimated_delivery_date,
          products (name)
        )
      `)
      .eq('reservation_status', 'CONFIRMED'),
    supabaseAdmin
      .from('prestation_reservations')
      .select(`
        id,
        delivery_address,
        reservation_status,
        customer_order_id,
        customer_orders (id, order_number, customer_infos),
        prestation_items (
          id,
          prestation_start,
          prestation_end,
          nb_of_people,
          google_event_id,
          products (name)
        )
      `)
      .eq('reservation_status', 'CONFIRMED'),
  ])

  if (rentalErr || purchaseErr || prestationErr) {
    console.error('[sync-calendar] Erreur récupération:', rentalErr || purchaseErr || prestationErr)
    return NextResponse.json({ error: 'Erreur lors de la récupération des réservations' }, { status: 500 })
  }

  // Regrouper par customer_order_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersById: Record<number, any> = {}

  const getOrCreate = (order: { id: number; order_number: number; customer_infos: object }) => {
    if (!ordersById[order.id]) {
      ordersById[order.id] = {
        id: order.id,
        order_number: order.order_number,
        customer_infos: order.customer_infos,
        rental_reservations: [],
        purchase_reservations: [],
        prestation_reservations: [],
      }
    }
    return ordersById[order.id]
  }

  for (const r of rentalRes || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = getOrCreate(r.customer_orders as any)
    order.rental_reservations.push({ id: r.id, delivery_address: r.delivery_address, rental_items: r.rental_items })
  }
  for (const p of purchaseRes || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = getOrCreate(p.customer_orders as any)
    order.purchase_reservations.push({ id: p.id, delivery_address: p.delivery_address, google_event_id: p.google_event_id, purchase_items: p.purchase_items })
  }
  for (const pr of prestationRes || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = getOrCreate(pr.customer_orders as any)
    order.prestation_reservations.push({ id: pr.id, delivery_address: pr.delivery_address, prestation_items: pr.prestation_items })
  }

  const allOrders = Object.values(ordersById)

  if (allOrders.length === 0) {
    return NextResponse.json({ synced: 0, message: 'Aucune réservation CONFIRMED trouvée' })
  }

  let synced = 0
  let created = 0
  const errors: string[] = []

  for (const order of allOrders) {
    try {
      created += await syncCalendarForOrder(order, supabaseAdmin)
      synced++
    } catch (err) {
      console.error(`[sync-calendar] Erreur commande #${order.order_number}:`, err)
      errors.push(`Commande #${order.order_number}`)
    }
  }

  return NextResponse.json({
    synced,
    total: allOrders.length,
    created,
    errors: errors.length > 0 ? errors : undefined,
    message: created > 0
      ? `${created} événement(s) créé(s) sur ${allOrders.length} commande(s) vérifiée(s) ✅`
      : `Aucun événement créé — ${allOrders.length} commande(s) déjà synchronisées ou échec silencieux (voir logs serveur)`,
  })
}
