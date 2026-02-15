import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface DateUpdate {
  table: 'rental_items' | 'purchase_items' | 'prestation_items'
  id: number
  rental_start?: string
  rental_end?: string
  prestation_start?: string
  prestation_end?: string
}

interface AvailabilityError {
  item_id: number
  table: string
  message: string
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    const { updates } = body as { updates: DateUpdate[] }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ available: true, errors: [] })
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
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const errors: AvailabilityError[] = []

    // Vérifier les rental_items
    const rentalUpdates = updates.filter(u => u.table === 'rental_items' && u.rental_start && u.rental_end)
    for (const update of rentalUpdates) {
      // Récupérer l'item actuel avec son produit (stock + quantity)
      const { data: currentItem } = await supabase
        .from('rental_items')
        .select('product_id, quantity, rental_start, rental_end')
        .eq('id', update.id)
        .single()

      if (!currentItem) continue

      const { data: product } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', currentItem.product_id)
        .single()

      if (!product) continue

      // Récupérer les indisponibilités existantes pour ce produit
      const { data: unavailabilities } = await supabase.rpc('get_product_unavailabilities', {
        product_id_param: currentItem.product_id,
      })

      // Générer les anciennes dates de cet item (pour les exclure)
      const oldDates = new Set<string>()
      const oldStart = new Date(currentItem.rental_start)
      const oldEnd = new Date(currentItem.rental_end)
      for (let d = new Date(oldStart); d <= oldEnd; d.setDate(d.getDate() + 1)) {
        oldDates.add(d.toISOString().split('T')[0])
      }

      // Générer les nouvelles dates demandées
      const newStart = new Date(update.rental_start!)
      const newEnd = new Date(update.rental_end!)
      const newDates: string[] = []
      for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
        newDates.push(d.toISOString().split('T')[0])
      }

      // Créer un map des réservations existantes par date
      const reservedByDate = new Map<string, number>()
      if (unavailabilities) {
        for (const entry of unavailabilities as { date: string; reserved_products: number }[]) {
          reservedByDate.set(entry.date, entry.reserved_products)
        }
      }

      // Vérifier chaque nouvelle date
      for (const date of newDates) {
        const existingReserved = reservedByDate.get(date) || 0
        // Soustraire la quantité de cet item si la date faisait partie de l'ancienne réservation
        const selfQuantity = oldDates.has(date) ? currentItem.quantity : 0
        const otherReserved = existingReserved - selfQuantity
        const totalAfterMove = otherReserved + currentItem.quantity

        if (totalAfterMove > product.stock) {
          const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          errors.push({
            item_id: update.id,
            table: 'rental_items',
            message: `Stock insuffisant le ${formattedDate} (${otherReserved + currentItem.quantity}/${product.stock} réservés)`,
          })
          break // Une seule erreur par item suffit
        }
      }
    }

    // Vérifier les prestation_items
    const prestationUpdates = updates.filter(u => u.table === 'prestation_items' && u.prestation_start && u.prestation_end)
    if (prestationUpdates.length > 0) {
      // Récupérer tous les créneaux occupés
      const { data: allSlots } = await supabase.rpc('get_all_prestation_unavailabilities')

      for (const update of prestationUpdates) {
        // Récupérer l'item actuel pour l'exclure
        const { data: currentItem } = await supabase
          .from('prestation_items')
          .select('id, prestation_start, prestation_end')
          .eq('id', update.id)
          .single()

        if (!currentItem) continue

        const newStart = new Date(update.prestation_start!)
        const newEnd = new Date(update.prestation_end!)

        // Vérifier le chevauchement avec les créneaux existants (sauf le créneau actuel)
        const hasConflict = (allSlots as { product_id: number; prestation_start: string; prestation_end: string }[] || []).some(slot => {
          // Exclure le créneau actuel de cet item (mêmes dates = c'est nous)
          const slotStart = new Date(slot.prestation_start)
          const slotEnd = new Date(slot.prestation_end)

          if (
            currentItem.prestation_start &&
            currentItem.prestation_end &&
            slotStart.getTime() === new Date(currentItem.prestation_start).getTime() &&
            slotEnd.getTime() === new Date(currentItem.prestation_end).getTime()
          ) {
            return false // C'est notre propre créneau, on l'ignore
          }

          return newStart < slotEnd && newEnd > slotStart
        })

        if (hasConflict) {
          errors.push({
            item_id: update.id,
            table: 'prestation_items',
            message: 'Créneau en conflit avec une autre prestation',
          })
        }
      }
    }

    return NextResponse.json({
      available: errors.length === 0,
      errors,
    })
  } catch (error) {
    console.error('Erreur API admin/items/check-availability:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
