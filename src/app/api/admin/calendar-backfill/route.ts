import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createCalendarEvent, createPurchaseEvent, createPrestationEvent, deleteCalendarEvent, calendarEventExists, getCalendarEventDetails } from '@/lib/google-calendar'

async function getSupabaseAdmin(authCookieValue: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  let accessToken: string
  try {
    const parsed = JSON.parse(authCookieValue)
    accessToken = parsed.access_token || parsed[0]
  } catch {
    accessToken = authCookieValue
  }
  return { supabase, accessToken }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const authCookie = allCookies.find(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    if (!authCookie?.value) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { supabase, accessToken } = await getSupabaseAdmin(authCookie.value)

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié - token invalide' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action: 'delete' | 'insert' | 'sync' | 'debug' = body.action ?? 'sync'

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const results = { deleted: 0, rentals: 0, purchases: 0, prestations: 0, errors: 0, skipped: 0 }

    // ── DEBUG : inspecter les events existants ────────────────────────────────
    if (action === 'debug') {
      const debugEntries: {
        itemId: number
        table: string
        eventId: string
        calendarType: string
        details: { exists: boolean; summary?: string; start?: string; status?: string }
      }[] = []

      const [
        { data: rentalItems },
        { data: purchases },
        { data: prestationItems },
      ] = await Promise.all([
        supabase
          .from('rental_items')
          .select('id, google_event_id, google_event_id_return, rental_reservation_id')
          .or('google_event_id.not.is.null,google_event_id_return.not.is.null'),
        supabase.from('purchase_reservations').select('id, google_event_id').eq('reservation_status', 'CONFIRMED').not('google_event_id', 'is', null),
        supabase
          .from('prestation_items')
          .select('id, google_event_id, prestation_reservation_id')
          .not('google_event_id', 'is', null),
      ])

      for (const item of rentalItems || []) {
        if (item.google_event_id) {
          const details = await getCalendarEventDetails('rentals', item.google_event_id)
          debugEntries.push({ itemId: item.id, table: 'rental_items', eventId: item.google_event_id, calendarType: 'rentals (pickup)', details })
          await delay(200)
        }
        if (item.google_event_id_return) {
          const details = await getCalendarEventDetails('rentals', item.google_event_id_return)
          debugEntries.push({ itemId: item.id, table: 'rental_items', eventId: item.google_event_id_return, calendarType: 'rentals (return)', details })
          await delay(200)
        }
      }
      for (const p of purchases || []) {
        if (p.google_event_id) {
          const details = await getCalendarEventDetails('purchases', p.google_event_id)
          debugEntries.push({ itemId: p.id, table: 'purchase_reservations', eventId: p.google_event_id, calendarType: 'purchases', details })
          await delay(200)
        }
      }
      for (const item of prestationItems || []) {
        if (item.google_event_id) {
          const details = await getCalendarEventDetails('prestations', item.google_event_id)
          debugEntries.push({ itemId: item.id, table: 'prestation_items', eventId: item.google_event_id, calendarType: 'prestations', details })
          await delay(200)
        }
      }

      return NextResponse.json({ success: true, debug: debugEntries })
    }

    // ── SUPPRESSION ────────────────────────────────────────────────────────────
    if (action === 'delete' || action === 'sync') {
      const [
        { data: rentalItemsWithEvents },
        { data: purchaseWithEvents },
        { data: prestationItemsWithEvents },
      ] = await Promise.all([
        supabase
          .from('rental_items')
          .select('id, google_event_id, google_event_id_return')
          .or('google_event_id.not.is.null,google_event_id_return.not.is.null'),
        supabase.from('purchase_reservations').select('id, google_event_id').not('google_event_id', 'is', null),
        supabase
          .from('prestation_items')
          .select('id, google_event_id')
          .not('google_event_id', 'is', null),
      ])

      const deleteQueue: { type: 'rentals' | 'purchases' | 'prestations'; eventId: string }[] = []

      for (const item of rentalItemsWithEvents || []) {
        if (item.google_event_id) deleteQueue.push({ type: 'rentals', eventId: item.google_event_id })
        if (item.google_event_id_return) deleteQueue.push({ type: 'rentals', eventId: item.google_event_id_return })
      }
      for (const p of purchaseWithEvents || []) {
        if (p.google_event_id) deleteQueue.push({ type: 'purchases', eventId: p.google_event_id })
      }
      for (const item of prestationItemsWithEvents || []) {
        if (item.google_event_id) deleteQueue.push({ type: 'prestations', eventId: item.google_event_id })
      }

      for (const task of deleteQueue) {
        await deleteCalendarEvent(task.type, task.eventId)
        await delay(200)
      }
      results.deleted = deleteQueue.length

      // Effacer les IDs dans la DB
      await Promise.all([
        rentalItemsWithEvents?.length
          ? supabase.from('rental_items').update({ google_event_id: null, google_event_id_return: null }).in('id', rentalItemsWithEvents.map(i => i.id))
          : Promise.resolve(),
        purchaseWithEvents?.length
          ? supabase.from('purchase_reservations').update({ google_event_id: null }).in('id', purchaseWithEvents.map(p => p.id))
          : Promise.resolve(),
        prestationItemsWithEvents?.length
          ? supabase.from('prestation_items').update({ google_event_id: null }).in('id', prestationItemsWithEvents.map(i => i.id))
          : Promise.resolve(),
      ])

      if (action === 'delete') {
        return NextResponse.json({
          success: true,
          message: `Suppression terminée : ${results.deleted} événement(s) supprimé(s) de Google Agenda.`,
          results,
        })
      }
    }

    // ── INSERTION DES CONFIRMED ────────────────────────────────────────────────
    if (action === 'insert' || action === 'sync') {
      // ── LOCATIONS : 1 pickup + 1 retour par rental_item ──
      const { data: rentalReservations } = await supabase
        .from('rental_reservations')
        .select(`
          id, delivery_address,
          customer_orders ( order_number, customer_infos ),
          rental_items ( id, rental_start, rental_end, quantity, google_event_id, google_event_id_return, products ( name ) )
        `)
        .eq('reservation_status', 'CONFIRMED')

      for (const r of rentalReservations || []) {
        const orderRaw = Array.isArray(r.customer_orders) ? r.customer_orders[0] : r.customer_orders
        const order = orderRaw as unknown as { order_number: string; customer_infos: { firstName: string; lastName: string; phone: string } }
        const items = (r.rental_items as unknown) as {
          id: number
          rental_start: string
          rental_end: string
          quantity: number
          google_event_id: string | null
          google_event_id_return: string | null
          products: { name: string }
        }[]

        for (const item of items || []) {
          try {
            const pickupExists = item.google_event_id ? await calendarEventExists('rentals', item.google_event_id) : false
            await delay(200)
            const returnExists = item.google_event_id_return ? await calendarEventExists('rentals', item.google_event_id_return) : false
            await delay(200)
            if (pickupExists && returnExists) { results.skipped++; continue }

            const productName = item.products?.name || ''
            const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`
            const description = `Commande #${order.order_number}\nClient : ${customerName}\nTél : ${order.customer_infos.phone}\nProduit : ${productName}\nQté : ${item.quantity}${r.delivery_address ? `\nLivraison : ${r.delivery_address}` : '\nRetrait en boutique'}`

            let newPickupId = item.google_event_id
            let newReturnId = item.google_event_id_return
            let created = false

            if (!pickupExists) {
              newPickupId = await createCalendarEvent('rentals', {
                summary: `📦 Livraison/Retrait - ${customerName}`,
                description,
                start: item.rental_start,
                end: item.rental_start,
              })
              await delay(200)
              created = true
            }
            if (!returnExists) {
              newReturnId = await createCalendarEvent('rentals', {
                summary: `↩️ Retour - ${customerName}`,
                description,
                start: item.rental_end,
                end: item.rental_end,
              })
              await delay(200)
              created = true
            }

            if (created) {
              await supabase.from('rental_items')
                .update({ google_event_id: newPickupId, google_event_id_return: newReturnId })
                .eq('id', item.id)
              results.rentals++
            }
          } catch {
            results.errors++
          }
        }
      }

      // ── ACHATS : 1 event par purchase_reservation (inchangé) ──
      const { data: purchaseReservations } = await supabase
        .from('purchase_reservations')
        .select(`
          id, delivery_address, created_at, google_event_id,
          customer_orders ( order_number, customer_infos ),
          purchase_items ( estimated_delivery_date, products ( name ) )
        `)
        .eq('reservation_status', 'CONFIRMED')

      for (const p of purchaseReservations || []) {
        try {
          const eventExists = p.google_event_id ? await calendarEventExists('purchases', p.google_event_id) : false
          if (eventExists) { await delay(200); continue }

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

      // ── PRESTATIONS : 1 event par prestation_item ──
      const { data: prestationReservations } = await supabase
        .from('prestation_reservations')
        .select(`
          id, delivery_address,
          customer_orders ( order_number, customer_infos ),
          prestation_items ( id, prestation_start, prestation_end, nb_of_people, google_event_id, products ( name ) )
        `)
        .eq('reservation_status', 'CONFIRMED')

      for (const p of prestationReservations || []) {
        const orderRaw = Array.isArray(p.customer_orders) ? p.customer_orders[0] : p.customer_orders
        const order = orderRaw as unknown as { order_number: string; customer_infos: { firstName: string; lastName: string; phone: string } }
        const items = (p.prestation_items as unknown) as {
          id: number
          prestation_start?: string
          prestation_end?: string
          nb_of_people: number
          google_event_id: string | null
          products: { name: string }
        }[]

        for (const item of items || []) {
          try {
            if (!item.prestation_start || !item.prestation_end) { results.skipped++; continue }

            const eventExists = item.google_event_id ? await calendarEventExists('prestations', item.google_event_id) : false
            if (eventExists) { await delay(200); results.skipped++; continue }

            const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`
            const productName = item.products?.name || ''

            const eventId = await createPrestationEvent({
              orderNumber: order.order_number,
              customerName,
              customerPhone: order.customer_infos.phone,
              serviceName: productName,
              nbOfPeople: item.nb_of_people || 1,
              prestationStart: item.prestation_start,
              prestationEnd: item.prestation_end,
              deliveryAddress: p.delivery_address || null,
            })

            if (eventId) {
              await supabase.from('prestation_items').update({ google_event_id: eventId }).eq('id', item.id)
              results.prestations++
            } else {
              results.errors++
            }
            await delay(200)
          } catch {
            results.errors++
          }
        }
      }

      if (action === 'insert') {
        const total = results.rentals + results.purchases + results.prestations
        return NextResponse.json({
          success: true,
          message: `Insertion terminée : ${total} événement(s) ajouté(s) (${results.rentals} locations, ${results.purchases} achats, ${results.prestations} prestations). ${results.skipped} ignorés. ${results.errors} erreurs.`,
          results,
        })
      }
    }

    // action === 'sync'
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée : ${results.deleted} supprimés, ${results.rentals} locations + ${results.purchases} achats + ${results.prestations} prestations recréés. ${results.skipped} ignorés. ${results.errors} erreurs.`,
      results,
    })
  } catch (error) {
    console.error('Erreur backfill calendar:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
