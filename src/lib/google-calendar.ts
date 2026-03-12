import { google } from 'googleapis'

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
