import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'

const TIMEZONE = 'Europe/Paris'

const CALENDAR_IDS = {
  rentals: process.env.GOOGLE_CALENDAR_ID_RENTALS!,
  purchases: process.env.GOOGLE_CALENDAR_ID_PURCHASES!,
  prestations: process.env.GOOGLE_CALENDAR_ID_PRESTATIONS!,
}

function getAuthClient() {
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY!.replace(/\\n/g, '\n')
  const clientEmail = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL!

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  return auth
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuthClient() })
}

// ==================== CRUD ====================

export async function calendarEventExists(
  calendarType: 'rentals' | 'purchases' | 'prestations',
  eventId: string
): Promise<boolean> {
  try {
    const calendar = getCalendarClient()
    const res = await calendar.events.get({ calendarId: CALENDAR_IDS[calendarType], eventId })
    return res.data.status !== 'cancelled'
  } catch {
    return false
  }
}

export async function getCalendarEventDetails(
  calendarType: 'rentals' | 'purchases' | 'prestations',
  eventId: string
): Promise<{ exists: boolean; summary?: string; start?: string; status?: string }> {
  try {
    const calendar = getCalendarClient()
    const res = await calendar.events.get({ calendarId: CALENDAR_IDS[calendarType], eventId })
    return {
      exists: res.data.status !== 'cancelled',
      summary: res.data.summary || undefined,
      start: res.data.start?.dateTime || res.data.start?.date || undefined,
      status: res.data.status || undefined,
    }
  } catch {
    return { exists: false }
  }
}

export async function createCalendarEvent(
  calendarType: 'rentals' | 'purchases' | 'prestations',
  event: {
    summary: string
    description: string
    start: string // ISO datetime or date
    end: string   // ISO datetime or date
    allDay?: boolean
  }
): Promise<string | null> {
  try {
    const calendar = getCalendarClient()
    const calendarId = CALENDAR_IDS[calendarType]

    const startObj = event.allDay
      ? { date: event.start.split('T')[0], timeZone: TIMEZONE }
      : { dateTime: event.start, timeZone: TIMEZONE }

    const endObj = event.allDay
      ? { date: event.end.split('T')[0], timeZone: TIMEZONE }
      : { dateTime: event.end, timeZone: TIMEZONE }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: startObj,
        end: endObj,
      },
    })

    return response.data.id || null
  } catch (error) {
    console.error(`[Google Calendar] Erreur création événement (${calendarType}):`, error)
    return null
  }
}

// Passer null comme summary pour préfixer ✅ au titre existant (confirmation)
export async function updateCalendarEvent(
  calendarType: 'rentals' | 'purchases' | 'prestations',
  eventId: string,
  summary: string | null
): Promise<void> {
  try {
    const calendar = getCalendarClient()
    const calendarId = CALENDAR_IDS[calendarType]

    const existing = await calendar.events.get({ calendarId, eventId })
    const existingTitle = existing.data.summary || ''
    const newTitle = summary ?? (existingTitle.startsWith('✅') ? existingTitle : `✅ ${existingTitle}`)

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: { summary: newTitle },
    })
  } catch (error) {
    console.error(`[Google Calendar] Erreur mise à jour événement (${calendarType}):`, error)
  }
}

export async function deleteCalendarEvent(
  calendarType: 'rentals' | 'purchases' | 'prestations',
  eventId: string
): Promise<void> {
  try {
    const calendar = getCalendarClient()
    await calendar.events.delete({
      calendarId: CALENDAR_IDS[calendarType],
      eventId,
    })
  } catch (error) {
    console.error(`[Google Calendar] Erreur suppression événement (${calendarType}):`, error)
  }
}

// ==================== DATE UPDATES ====================

export async function updateRentalEventDates(
  pickupEventId: string | null,
  returnEventId: string | null,
  rentalStart: string,
  rentalEnd: string
): Promise<void> {
  try {
    const calendar = getCalendarClient()
    const calendarId = CALENDAR_IDS['rentals']
    const startObj = { dateTime: rentalStart, timeZone: TIMEZONE }
    const endObj = { dateTime: rentalEnd, timeZone: TIMEZONE }

    await Promise.all([
      pickupEventId
        ? calendar.events.patch({
            calendarId,
            eventId: pickupEventId,
            requestBody: { start: startObj, end: startObj },
          })
        : Promise.resolve(),
      returnEventId
        ? calendar.events.patch({
            calendarId,
            eventId: returnEventId,
            requestBody: { start: endObj, end: endObj },
          })
        : Promise.resolve(),
    ])
  } catch (error) {
    console.error('[Google Calendar] Erreur mise à jour dates location:', error)
  }
}

export async function updatePurchaseEventDate(
  eventId: string,
  estimatedDeliveryDate: string
): Promise<void> {
  try {
    const calendar = getCalendarClient()
    const calendarId = CALENDAR_IDS['purchases']
    const dateStr = estimatedDeliveryDate.split('T')[0]
    const endDate = new Date(dateStr)
    endDate.setDate(endDate.getDate() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: { date: dateStr, timeZone: TIMEZONE },
        end: { date: endDateStr, timeZone: TIMEZONE },
      },
    })
  } catch (error) {
    console.error('[Google Calendar] Erreur mise à jour date achat:', error)
  }
}

export async function updatePrestationEventDates(
  eventId: string,
  prestationStart: string,
  prestationEnd: string
): Promise<void> {
  try {
    const calendar = getCalendarClient()
    const calendarId = CALENDAR_IDS['prestations']

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: { dateTime: prestationStart, timeZone: TIMEZONE },
        end: { dateTime: prestationEnd, timeZone: TIMEZONE },
      },
    })
  } catch (error) {
    console.error('[Google Calendar] Erreur mise à jour dates prestation:', error)
  }
}

// ==================== BUILDERS ====================

interface RentalEventData {
  orderNumber: string
  customerName: string
  customerPhone: string
  productNames: string[]
  rentalStart: string // ISO
  rentalEnd: string   // ISO
  deliveryAddress?: string | null
}

interface PurchaseEventData {
  orderNumber: string
  customerName: string
  customerPhone: string
  productNames: string[]
  estimatedDeliveryDate: string // ISO
  deliveryAddress?: string | null
}

interface PrestationEventData {
  orderNumber: string
  customerName: string
  customerPhone: string
  serviceName: string
  nbOfPeople: number
  prestationStart: string // ISO
  prestationEnd: string   // ISO
  deliveryAddress?: string | null
}

export async function createRentalEvents(data: RentalEventData): Promise<{ pickupEventId: string | null; returnEventId: string | null }> {
  const deliveryInfo = data.deliveryAddress ? `\nLivraison : ${data.deliveryAddress}` : '\nRetrait en boutique'
  const description = `Commande #${data.orderNumber}\nClient : ${data.customerName}\nTél : ${data.customerPhone}\nProduits : ${data.productNames.join(', ')}${deliveryInfo}`

  const [pickupEventId, returnEventId] = await Promise.all([
    createCalendarEvent('rentals', {
      summary: `📦 Livraison/Retrait - ${data.customerName}`,
      description,
      start: data.rentalStart,
      end: data.rentalStart, // Même heure début/fin pour un événement ponctuel
    }),
    createCalendarEvent('rentals', {
      summary: `↩️ Retour - ${data.customerName}`,
      description,
      start: data.rentalEnd,
      end: data.rentalEnd,
    }),
  ])

  return { pickupEventId, returnEventId }
}

export async function createPurchaseEvent(data: PurchaseEventData): Promise<string | null> {
  const deliveryInfo = data.deliveryAddress ? `\nLivraison : ${data.deliveryAddress}` : '\nRetrait en boutique'
  const description = `Commande #${data.orderNumber}\nClient : ${data.customerName}\nTél : ${data.customerPhone}\nProduits : ${data.productNames.join(', ')}${deliveryInfo}`

  // Jour entier à la date de livraison estimée
  const dateStr = data.estimatedDeliveryDate.split('T')[0]
  // Pour un événement all-day Google Calendar, end doit être le lendemain
  const endDate = new Date(dateStr)
  endDate.setDate(endDate.getDate() + 1)
  const endDateStr = endDate.toISOString().split('T')[0]

  return createCalendarEvent('purchases', {
    summary: `🛍️ Livraison estimée - ${data.customerName}`,
    description,
    start: dateStr,
    end: endDateStr,
    allDay: true,
  })
}

export async function createPrestationEvent(data: PrestationEventData): Promise<string | null> {
  const deliveryInfo = data.deliveryAddress ? `\nÀ domicile : ${data.deliveryAddress}` : '\nEn boutique'
  const description = `Commande #${data.orderNumber}\nClient : ${data.customerName}\nTél : ${data.customerPhone}\nPrestation : ${data.serviceName}\nNombre de personnes : ${data.nbOfPeople}${deliveryInfo}`

  return createCalendarEvent('prestations', {
    summary: `🌿 Henné - ${data.customerName} (${data.nbOfPeople} pers.)`,
    description,
    start: data.prestationStart,
    end: data.prestationEnd,
  })
}

// ==================== SYNC COMMANDE ====================

interface OrderForCalendarSync {
  order_number: number | string
  customer_infos: { firstName: string; lastName: string; phone: string }
  rental_reservations?: Array<{
    id: number
    delivery_address?: string | null
    rental_items?: Array<{
      id: number
      rental_start: string
      rental_end: string
      quantity: number
      google_event_id?: string | null
      google_event_id_return?: string | null
      products?: { name: string } | null
    }>
  }>
  purchase_reservations?: Array<{
    id: number
    delivery_address?: string | null
    google_event_id?: string | null
    purchase_items?: Array<{
      estimated_delivery_date?: string | null
      products?: { name: string } | null
    }>
  }>
  prestation_reservations?: Array<{
    id: number
    delivery_address?: string | null
    prestation_items?: Array<{
      id: number
      prestation_start?: string | null
      prestation_end?: string | null
      nb_of_people?: number
      google_event_id?: string | null
      products?: { name: string } | null
    }>
  }>
}

/**
 * Crée les événements Google Calendar manquants pour une commande confirmée.
 * Vérifie l'existence réelle dans Google Calendar (pas seulement la BDD) pour
 * recréer les événements supprimés ou perdus.
 * Retourne le nombre d'événements effectivement créés.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncCalendarForOrder(order: OrderForCalendarSync, supabase: SupabaseClient<any>): Promise<number> {
  let created = 0
  const customerName = `${order.customer_infos.firstName} ${order.customer_infos.lastName}`
  const customerPhone = order.customer_infos.phone
  const orderNumber = String(order.order_number)

  console.log(`[sync] Commande #${orderNumber} — rentals:${(order.rental_reservations||[]).length} purchases:${(order.purchase_reservations||[]).length} prestations:${(order.prestation_reservations||[]).length}`)

  // Locations : 1 event pickup + 1 event retour par rental_item
  for (const r of order.rental_reservations || []) {
    for (const item of r.rental_items || []) {
      const pickupExists = item.google_event_id ? await calendarEventExists('rentals', item.google_event_id) : false
      const returnExists = item.google_event_id_return ? await calendarEventExists('rentals', item.google_event_id_return) : false

      if (pickupExists && returnExists) {
        // Les deux events existent : mettre à jour leurs dates
        await updateRentalEventDates(item.google_event_id!, item.google_event_id_return!, item.rental_start, item.rental_end)
        continue
      }

      const productName = item.products?.name || ''
      const description = `Commande #${orderNumber}\nClient : ${customerName}\nTél : ${customerPhone}\nProduit : ${productName}\nQté : ${item.quantity}${r.delivery_address ? `\nLivraison : ${r.delivery_address}` : '\nRetrait en boutique'}`
      const [pickupEventId, returnEventId] = await Promise.all([
        pickupExists
          ? Promise.resolve(item.google_event_id!)
          : createCalendarEvent('rentals', {
              summary: `📦 Livraison/Retrait - ${customerName}`,
              description,
              start: item.rental_start,
              end: item.rental_start,
            }),
        returnExists
          ? Promise.resolve(item.google_event_id_return!)
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
        if (!pickupExists) created++
        if (!returnExists) created++
      }
    }
  }

  // Achats : 1 event par purchase_reservation
  for (const p of order.purchase_reservations || []) {
    const exists = p.google_event_id ? await calendarEventExists('purchases', p.google_event_id) : false
    const items = p.purchase_items || []
    if (!items.length) continue
    const estimatedDate = items[0]?.estimated_delivery_date
      || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (exists) {
      // Mettre à jour la date
      await updatePurchaseEventDate(p.google_event_id!, estimatedDate)
      continue
    }

    const eventId = await createPurchaseEvent({
      orderNumber,
      customerName,
      customerPhone,
      productNames: items.map(i => i.products?.name || ''),
      estimatedDeliveryDate: estimatedDate,
      deliveryAddress: p.delivery_address || null,
    })
    if (eventId) {
      await supabase.from('purchase_reservations')
        .update({ google_event_id: eventId })
        .eq('id', p.id)
      created++
    }
  }

  // Prestations : 1 event par prestation_item
  for (const pr of order.prestation_reservations || []) {
    for (const item of pr.prestation_items || []) {
      if (!item.prestation_start || !item.prestation_end) continue
      const exists = item.google_event_id ? await calendarEventExists('prestations', item.google_event_id) : false

      if (exists) {
        // Mettre à jour les dates
        await updatePrestationEventDates(item.google_event_id!, item.prestation_start, item.prestation_end)
        continue
      }

      const eventId = await createPrestationEvent({
        orderNumber,
        customerName,
        customerPhone,
        serviceName: item.products?.name || '',
        nbOfPeople: item.nb_of_people || 1,
        prestationStart: item.prestation_start,
        prestationEnd: item.prestation_end,
        deliveryAddress: pr.delivery_address || null,
      })
      if (eventId) {
        await supabase.from('prestation_items')
          .update({ google_event_id: eventId })
          .eq('id', item.id)
        created++
      }
    }
  }

  return created
}
