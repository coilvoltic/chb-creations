import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRentalEvents, createPurchaseEvent, createPrestationEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookie = allCookies.find(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    let accessToken: string
    try {
      const parsed = JSON.parse(authCookie.value)
      accessToken = parsed.access_token || parsed[0]
    } catch {
      accessToken = authCookie.value
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié - token invalide' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const results = { deleted: 0, rentals: 0, purchases: 0, prestations: 0, errors: 0, skipped: 0 }
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // ── PHASE 1 : Supprimer tous les événements Calendar existants ──────────────

    const [
      { data: rentalWithEvents },
      { data: purchaseWithEvents },
      { data: prestationWithEvents },
    ] = await Promise.all([
      supabase.from('rental_reservations').select('id, google_event_id, google_event_id_return').not('google_event_id', 'is', null),
      supabase.from('purchase_reservations').select('id, google_event_id').not('google_event_id', 'is', null),
      supabase.from('prestation_reservations').select('id, google_event_id').not('google_event_id', 'is', null),
    ])

    const deleteQueue: { type: 'rentals' | 'purchases' | 'prestations'; eventId: string }[] = []
    for (const r of rentalWithEvents || []) {
      if (r.google_event_id) deleteQueue.push({ type: 'rentals', eventId: r.google_event_id })
      if (r.google_event_id_return) deleteQueue.push({ type: 'rentals', eventId: r.google_event_id_return })
    }
    for (const p of purchaseWithEvents || []) {
      if (p.google_event_id) deleteQueue.push({ type: 'purchases', eventId: p.google_event_id })
    }
    for (const p of prestationWithEvents || []) {
      if (p.google_event_id) deleteQueue.push({ type: 'prestations', eventId: p.google_event_id })
    }

    for (const task of deleteQueue) {
      await deleteCalendarEvent(task.type, task.eventId)
      await delay(200)
    }
    results.deleted = deleteQueue.length

    await Promise.all([
      (rentalWithEvents?.length)
        ? supabase.from('rental_reservations').update({ google_event_id: null, google_event_id_return: null }).in('id', rentalWithEvents.map(r => r.id))
        : Promise.resolve(),
      (purchaseWithEvents?.length)
        ? supabase.from('purchase_reservations').update({ google_event_id: null }).in('id', purchaseWithEvents.map(p => p.id))
        : Promise.resolve(),
      (prestationWithEvents?.length)
        ? supabase.from('prestation_reservations').update({ google_event_id: null }).in('id', prestationWithEvents.map(p => p.id))
        : Promise.resolve(),
    ])

    // ── PHASE 2 : Recréer uniquement les CONFIRMED ──────────────────────────────

    // ── LOCATIONS ──
    const { data: rentalReservations } = await supabase
      .from('rental_reservations')
      .select(`
        id, delivery_address,
        customer_orders ( order_number, customer_infos ),
        rental_items ( rental_start, rental_end, products ( name ) )
      `)
      .eq('reservation_status', 'CONFIRMED')

    for (const r of rentalReservations || []) {
      try {
        const orderRaw = Array.isArray(r.customer_orders) ? r.customer_orders[0] : r.customer_orders
        const order = orderRaw as unknown as { order_number: string; customer_infos: { firstName: string; lastName: string; phone: string } }
        const items = (r.rental_items as unknown) as { rental_start: string; rental_end: string; products: { name: string } }[]

        if (!items?.length) { results.skipped++; continue }

        const startDates = items.map(i => new Date(i.rental_start).getTime())
        const endDates = items.map(i => new Date(i.rental_end).getTime())

        const { pickupEventId, returnEventId } = await createRentalEvents({
          orderNumber: order.order_number,
          customerName: `${order.customer_infos.firstName} ${order.customer_infos.lastName}`,
          customerPhone: order.customer_infos.phone,
          productNames: items.map(i => i.products.name),
          rentalStart: new Date(Math.min(...startDates)).toISOString(),
          rentalEnd: new Date(Math.max(...endDates)).toISOString(),
          deliveryAddress: r.delivery_address || null,
        })

        if (pickupEventId || returnEventId) {
          await supabase.from('rental_reservations')
            .update({ google_event_id: pickupEventId, google_event_id_return: returnEventId })
            .eq('id', r.id)
          results.rentals++
        } else {
          results.errors++
        }
        await delay(200)
      } catch {
        results.errors++
      }
    }

    // ── ACHATS ──
    const { data: purchaseReservations } = await supabase
      .from('purchase_reservations')
      .select(`
        id, delivery_address, created_at,
        customer_orders ( order_number, customer_infos ),
        purchase_items ( estimated_delivery_date, products ( name ) )
      `)
      .eq('reservation_status', 'CONFIRMED')

    for (const p of purchaseReservations || []) {
      try {
        const orderRaw = Array.isArray(p.customer_orders) ? p.customer_orders[0] : p.customer_orders
        const order = orderRaw as unknown as { order_number: string; customer_infos: { firstName: string; lastName: string; phone: string } }
        const items = (p.purchase_items as unknown) as { estimated_delivery_date?: string; products: { name: string } }[]

        if (!items?.length) { results.skipped++; continue }

        const estimatedDate = items[0]?.estimated_delivery_date
          || new Date(new Date(p.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const eventId = await createPurchaseEvent({
          orderNumber: order.order_number,
          customerName: `${order.customer_infos.firstName} ${order.customer_infos.lastName}`,
          customerPhone: order.customer_infos.phone,
          productNames: items.map(i => i.products.name),
          estimatedDeliveryDate: estimatedDate,
          deliveryAddress: p.delivery_address || null,
        })

        if (eventId) {
          await supabase.from('purchase_reservations').update({ google_event_id: eventId }).eq('id', p.id)
          results.purchases++
        } else {
          results.errors++
        }
        await delay(200)
      } catch {
        results.errors++
      }
    }

    // ── PRESTATIONS ──
    const { data: prestationReservations } = await supabase
      .from('prestation_reservations')
      .select(`
        id, delivery_address,
        customer_orders ( order_number, customer_infos ),
        prestation_items ( prestation_start, prestation_end, nb_of_people, products ( name ) )
      `)
      .eq('reservation_status', 'CONFIRMED')

    for (const p of prestationReservations || []) {
      try {
        const orderRaw = Array.isArray(p.customer_orders) ? p.customer_orders[0] : p.customer_orders
        const order = orderRaw as unknown as { order_number: string; customer_infos: { firstName: string; lastName: string; phone: string } }
        const items = (p.prestation_items as unknown) as { prestation_start?: string; prestation_end?: string; nb_of_people: number; products: { name: string } }[]

        const firstItem = items?.find(i => i.prestation_start && i.prestation_end)
        if (!firstItem) { results.skipped++; continue }

        const eventId = await createPrestationEvent({
          orderNumber: order.order_number,
          customerName: `${order.customer_infos.firstName} ${order.customer_infos.lastName}`,
          customerPhone: order.customer_infos.phone,
          serviceName: items.map(i => i.products.name).join(', '),
          nbOfPeople: items.reduce((sum, i) => sum + (i.nb_of_people || 1), 0),
          prestationStart: firstItem.prestation_start!,
          prestationEnd: firstItem.prestation_end!,
          deliveryAddress: p.delivery_address || null,
        })

        if (eventId) {
          await supabase.from('prestation_reservations').update({ google_event_id: eventId }).eq('id', p.id)
          results.prestations++
        } else {
          results.errors++
        }
        await delay(200)
      } catch {
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill terminé : ${results.deleted} supprimés, ${results.rentals} locations + ${results.purchases} achats + ${results.prestations} prestations recréés. ${results.skipped} ignorés (sans dates). ${results.errors} erreurs.`,
      results,
    })
  } catch (error) {
    console.error('Erreur backfill calendar:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
