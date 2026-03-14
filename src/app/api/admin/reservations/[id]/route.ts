import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { deleteCalendarEvent, createCalendarEvent, createPurchaseEvent, createPrestationEvent } from '@/lib/google-calendar'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Pour chaque rental_reservation, récupérer ses items et tags
    const rentalReservationsWithItems = await Promise.all(
      (rentalReservations || []).map(async (reservation) => {
        const [{ data: items, error: itemsError }, { data: reservationTags }] = await Promise.all([
          supabase
            .from('rental_items')
            .select(`
              *,
              products (
                name,
                slug,
                images,
                price,
                new_price,
                category,
                subcategory
              )
            `)
            .eq('rental_reservation_id', reservation.id)
            .order('id', { ascending: true }),
          supabase
            .from('reservation_tags')
            .select('*, tag:tags(*)')
            .eq('rental_reservation_id', reservation.id)
        ])

        if (itemsError) {
          console.error('Erreur récupération rental_items:', itemsError)
        }

        const tags = reservationTags?.map(rt => rt.tag).filter(Boolean) || []

        return {
          ...reservation,
          items: items || [],
          tags,
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

    // Pour chaque purchase_reservation, récupérer ses items et tags
    const purchaseReservationsWithItems = await Promise.all(
      (purchaseReservations || []).map(async (reservation) => {
        const [{ data: items, error: itemsError }, { data: reservationTags }] = await Promise.all([
          supabase
            .from('purchase_items')
            .select(`
              *,
              products (
                name,
                slug,
                images,
                price,
                new_price,
                category,
                subcategory
              )
            `)
            .eq('purchase_reservation_id', reservation.id)
            .order('id', { ascending: true }),
          supabase
            .from('reservation_tags')
            .select('*, tag:tags(*)')
            .eq('purchase_reservation_id', reservation.id)
        ])

        if (itemsError) {
          console.error('Erreur récupération purchase_items:', itemsError)
        }

        const tags = reservationTags?.map(rt => rt.tag).filter(Boolean) || []

        return {
          ...reservation,
          items: items || [],
          tags,
        }
      })
    )

    // Récupérer les prestation_reservations de cette commande
    const { data: prestationReservations, error: prestationError } = await supabase
      .from('prestation_reservations')
      .select('*')
      .eq('customer_order_id', id)
      .order('id', { ascending: true })

    if (prestationError) {
      console.error('Erreur récupération prestation_reservations:', prestationError)
    }

    console.log('Prestation reservations trouvées:', prestationReservations?.length || 0)

    // Pour chaque prestation_reservation, récupérer ses items et tags
    const prestationReservationsWithItems = await Promise.all(
      (prestationReservations || []).map(async (reservation) => {
        const [{ data: items, error: itemsError }, { data: reservationTags }] = await Promise.all([
          supabase
            .from('prestation_items')
            .select(`
              *,
              products (
                name,
                slug,
                images,
                price,
                new_price,
                category,
                subcategory
              )
            `)
            .eq('prestation_reservation_id', reservation.id)
            .order('id', { ascending: true }),
          supabase
            .from('reservation_tags')
            .select('*, tag:tags(*)')
            .eq('prestation_reservation_id', reservation.id)
        ])

        if (itemsError) {
          console.error('Erreur récupération prestation_items:', itemsError)
        }

        const tags = reservationTags?.map(rt => rt.tag).filter(Boolean) || []

        return {
          ...reservation,
          items: items || [],
          tags,
        }
      })
    )

    return NextResponse.json({
      order,
      rental_reservations: rentalReservationsWithItems,
      purchase_reservations: purchaseReservationsWithItems,
      prestation_reservations: prestationReservationsWithItems
    })
  } catch (error) {
    console.error('Erreur API admin/reservations/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const body = await request.json()

    const { new_status, notes, amount_paid, confirm_order } = body

    // Validation: au moins un champ à mettre à jour
    if (!new_status && notes === undefined && amount_paid === undefined && confirm_order === undefined) {
      return NextResponse.json({
        error: 'Paramètres manquants. Requis: new_status, notes, amount_paid ou confirm_order'
      }, { status: 400 })
    }

    // Valider le statut si fourni
    if (new_status) {
      const validStatuses = ['CONFIRMED', 'PENDING', 'DONE', 'CANCELLED']
      if (!validStatuses.includes(new_status)) {
        return NextResponse.json({
          error: `new_status invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
        }, { status: 400 })
      }
    }

    // Valider le montant si fourni
    if (amount_paid !== undefined && (typeof amount_paid !== 'number' || amount_paid < 0)) {
      return NextResponse.json({
        error: 'amount_paid doit être un nombre positif'
      }, { status: 400 })
    }

    // Authentification
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
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié - token invalide' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Mettre à jour les notes sur customer_orders si fourni
    if (notes !== undefined) {
      const { error: notesError } = await supabase
        .from('customer_orders')
        .update({ notes: notes || null })
        .eq('id', id)

      if (notesError) {
        console.error('Erreur mise à jour notes:', notesError)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour des notes' }, { status: 500 })
      }

      // Si seules les notes sont mises à jour, retourner directement
      if (!new_status && amount_paid === undefined && confirm_order === undefined) {
        return NextResponse.json({ success: true, message: 'Notes mises à jour' })
      }
    }

    // Mettre à jour already_paid si amount_paid est fourni (remplacement, pas incrément)
    if (amount_paid !== undefined) {
      const { error: updateError } = await supabase
        .from('customer_orders')
        .update({ already_paid: amount_paid })
        .eq('id', id)

      if (updateError) {
        console.error('Erreur mise à jour already_paid:', updateError)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du montant payé' }, { status: 500 })
      }

      console.log(`[PATCH] already_paid set to: ${amount_paid}`)
    }

    // Déterminer le statut à appliquer
    const statusToApply = new_status || (confirm_order ? 'CONFIRMED' : null)

    // Si pas de changement de statut, retourner
    if (!statusToApply) {
      return NextResponse.json({
        success: true,
        message: amount_paid ? `Montant de ${amount_paid} € enregistré` : 'Mise à jour effectuée'
      })
    }

    // Mettre à jour TOUTES les sous-réservations de cette commande
    const updates = []
    const errors = []

    console.log(`[PATCH] Updating order ${id} to status: ${statusToApply}`)

    // Mettre à jour rental_reservations
    const { data: rentalData, error: rentalError } = await supabase
      .from('rental_reservations')
      .update({ reservation_status: statusToApply })
      .eq('customer_order_id', id)
      .select()

    if (rentalError) {
      console.error('Erreur mise à jour rental_reservations:', rentalError)
      errors.push({ table: 'rental_reservations', error: rentalError.message })
    } else {
      updates.push('rental_reservations')
    }

    // Mettre à jour purchase_reservations
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchase_reservations')
      .update({ reservation_status: statusToApply })
      .eq('customer_order_id', id)
      .select()

    if (purchaseError) {
      console.error('Erreur mise à jour purchase_reservations:', purchaseError)
      errors.push({ table: 'purchase_reservations', error: purchaseError.message })
    } else {
      updates.push('purchase_reservations')
    }

    // Mettre à jour prestation_reservations
    const { data: prestationData, error: prestationError } = await supabase
      .from('prestation_reservations')
      .update({ reservation_status: statusToApply })
      .eq('customer_order_id', id)
      .select()

    if (prestationError) {
      console.error('Erreur mise à jour prestation_reservations:', prestationError)
      errors.push({ table: 'prestation_reservations', error: prestationError.message })
    } else {
      updates.push('prestation_reservations')
    }

    // Sync Google Calendar selon le nouveau statut
    try {
      if (statusToApply === 'CANCELLED') {
        const tasks: Promise<void>[] = []

        // Lire les google_event_id depuis les items (plus depuis les reservations)
        const rentalIds = (rentalData || []).map(r => r.id)
        const prestationIds = (prestationData || []).map(p => p.id)

        if (rentalIds.length > 0) {
          const { data: rentalItems } = await supabase
            .from('rental_items')
            .select('google_event_id, google_event_id_return')
            .in('rental_reservation_id', rentalIds)
          ;(rentalItems || []).forEach(item => {
            if (item.google_event_id) tasks.push(deleteCalendarEvent('rentals', item.google_event_id))
            if (item.google_event_id_return) tasks.push(deleteCalendarEvent('rentals', item.google_event_id_return))
          })
        }

        ;(purchaseData || []).forEach(p => {
          if (p.google_event_id) tasks.push(deleteCalendarEvent('purchases', p.google_event_id))
        })

        if (prestationIds.length > 0) {
          const { data: prestationItems } = await supabase
            .from('prestation_items')
            .select('google_event_id')
            .in('prestation_reservation_id', prestationIds)
          ;(prestationItems || []).forEach(item => {
            if (item.google_event_id) tasks.push(deleteCalendarEvent('prestations', item.google_event_id))
          })
        }

        await Promise.all(tasks)
      } else if (statusToApply === 'CONFIRMED') {
        // Charger les infos client et les items pour créer les événements Calendar
        const { data: order } = await supabase
          .from('customer_orders')
          .select('order_number, customer_infos')
          .eq('id', id)
          .single()

        if (order) {
          const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`
          const customerPhone = order.customer_infos.phone
          const orderNumber = String(order.order_number)

          // Locations : 1 event pickup + 1 event retour par rental_item
          for (const r of rentalData || []) {
            const { data: items } = await supabase
              .from('rental_items')
              .select('id, rental_start, rental_end, quantity, google_event_id, google_event_id_return, products(name)')
              .eq('rental_reservation_id', r.id)
            for (const item of items || []) {
              if (item.google_event_id && item.google_event_id_return) continue // déjà créé
              const productName = (item.products as { name: string } | null)?.name || ''
              const description = `Commande #${orderNumber}\nClient : ${customerName}\nTél : ${customerPhone}\nProduit : ${productName}\nQté : ${item.quantity}${r.delivery_address ? `\nLivraison : ${r.delivery_address}` : '\nRetrait en boutique'}`
              const [pickupEventId, returnEventId] = await Promise.all([
                item.google_event_id
                  ? Promise.resolve(item.google_event_id)
                  : createCalendarEvent('rentals', {
                      summary: `📦 Livraison/Retrait - ${customerName}`,
                      description,
                      start: item.rental_start,
                      end: item.rental_start,
                    }),
                item.google_event_id_return
                  ? Promise.resolve(item.google_event_id_return)
                  : createCalendarEvent('rentals', {
                      summary: `↩️ Retour - ${customerName}`,
                      description,
                      start: item.rental_end,
                      end: item.rental_end,
                    }),
              ])
              if (pickupEventId || returnEventId) {
                await supabase.from('rental_items')
                  .update({ google_event_id: pickupEventId, google_event_id_return: returnEventId })
                  .eq('id', item.id)
              }
            }
          }

          // Achats
          for (const p of purchaseData || []) {
            if (p.google_event_id) continue
            const { data: items } = await supabase
              .from('purchase_items')
              .select('estimated_delivery_date, products(name)')
              .eq('purchase_reservation_id', p.id)
            if (items?.length) {
              const estimatedDate = items[0]?.estimated_delivery_date
                || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              const eventId = await createPurchaseEvent({
                orderNumber,
                customerName,
                customerPhone,
                productNames: (items as unknown as { products: { name: string } | null }[]).map(i => i.products?.name || ''),
                estimatedDeliveryDate: estimatedDate,
                deliveryAddress: p.delivery_address || null,
              })
              if (eventId) {
                await supabase.from('purchase_reservations')
                  .update({ google_event_id: eventId })
                  .eq('id', p.id)
              }
            }
          }

          // Prestations : 1 event par prestation_item
          for (const p of prestationData || []) {
            const { data: items } = await supabase
              .from('prestation_items')
              .select('id, prestation_start, prestation_end, nb_of_people, google_event_id, products(name)')
              .eq('prestation_reservation_id', p.id)
            for (const item of items || []) {
              if (item.google_event_id) continue // déjà créé
              if (!item.prestation_start || !item.prestation_end) continue
              const productName = (item.products as { name: string } | null)?.name || ''
              const eventId = await createPrestationEvent({
                orderNumber,
                customerName,
                customerPhone,
                serviceName: productName,
                nbOfPeople: item.nb_of_people || 1,
                prestationStart: item.prestation_start,
                prestationEnd: item.prestation_end,
                deliveryAddress: p.delivery_address || null,
              })
              if (eventId) {
                await supabase.from('prestation_items')
                  .update({ google_event_id: eventId })
                  .eq('id', item.id)
              }
            }
          }
        }
      }
    } catch (calendarError) {
      console.error('[Google Calendar] Erreur sync statut:', calendarError)
    }

    // Si toutes les mises à jour ont échoué
    if (errors.length === 3) {
      return NextResponse.json({
        error: 'Erreur lors de la mise à jour du statut',
        details: errors
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: confirm_order
        ? `Commande confirmée${amount_paid ? ` et ${amount_paid} € enregistrés` : ''}`
        : `Statut mis à jour: ${statusToApply}`,
      updatedTables: updates,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Erreur API PATCH admin/reservations/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
