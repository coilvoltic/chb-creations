import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendDatesUpdateNotification } from '@/lib/email'
import { getSelectedOptionsFromDB, getInstallationFeesFromDB } from '@/lib/reservation-utils'

interface DateUpdate {
  table: 'rental_items' | 'purchase_items' | 'prestation_items'
  id: number
  rental_start?: string
  rental_end?: string
  estimated_delivery_date?: string
  prestation_start?: string
  prestation_end?: string
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    const { updates, notify_customer, order_id } = body as {
      updates: DateUpdate[]
      notify_customer?: boolean
      order_id?: string
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 })
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

    const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const validTables = ['rental_items', 'purchase_items', 'prestation_items']
    const errors: { id: number; table: string; error: string }[] = []

    await Promise.all(
      updates.map(async (update) => {
        if (!validTables.includes(update.table)) {
          errors.push({ id: update.id, table: update.table, error: 'Table invalide' })
          return
        }

        const updateData: Record<string, string> = {}

        if (update.table === 'rental_items') {
          if (update.rental_start) updateData.rental_start = update.rental_start
          if (update.rental_end) updateData.rental_end = update.rental_end
        } else if (update.table === 'purchase_items') {
          if (update.estimated_delivery_date) updateData.estimated_delivery_date = update.estimated_delivery_date
        } else if (update.table === 'prestation_items') {
          if (update.prestation_start) updateData.prestation_start = update.prestation_start
          if (update.prestation_end) updateData.prestation_end = update.prestation_end
        }

        if (Object.keys(updateData).length === 0) return

        const { error } = await supabase
          .from(update.table)
          .update(updateData)
          .eq('id', update.id)

        if (error) {
          console.error(`Erreur mise à jour ${update.table} id=${update.id}:`, error)
          errors.push({ id: update.id, table: update.table, error: error.message })
        }
      })
    )

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Certaines mises à jour ont échoué',
        details: errors
      }, { status: 500 })
    }

    // Notification client par email avec PDF mis à jour
    if (notify_customer && order_id) {
      try {
        // Récupérer la commande complète avec toutes les données à jour
        const { data: order } = await supabase
          .from('customer_orders')
          .select('*')
          .eq('id', order_id)
          .single()

        if (order) {
          // Récupérer toutes les sous-réservations et items en parallèle
          const [
            { data: rentalReservations },
            { data: purchaseReservations },
            { data: prestationReservations }
          ] = await Promise.all([
            supabase.from('rental_reservations').select('*').eq('customer_order_id', order_id),
            supabase.from('purchase_reservations').select('*').eq('customer_order_id', order_id),
            supabase.from('prestation_reservations').select('*').eq('customer_order_id', order_id),
          ])

          // Récupérer les items avec les produits
          const [
            { data: rentalItems },
            { data: purchaseItems },
            { data: prestationItems }
          ] = await Promise.all([
            rentalReservations?.length
              ? supabase.from('rental_items').select('*, products(name, price, new_price)').in('rental_reservation_id', rentalReservations.map(r => r.id))
              : Promise.resolve({ data: [] as never[] }),
            purchaseReservations?.length
              ? supabase.from('purchase_items').select('*, products(name, price, new_price)').in('purchase_reservation_id', purchaseReservations.map(r => r.id))
              : Promise.resolve({ data: [] as never[] }),
            prestationReservations?.length
              ? supabase.from('prestation_items').select('*, products(name, price, new_price)').in('prestation_reservation_id', prestationReservations.map(r => r.id))
              : Promise.resolve({ data: [] as never[] }),
          ])

          const firstRental = rentalReservations?.[0]
          const firstPurchase = purchaseReservations?.[0]

          // Détection cas mix boutique+domicile : 2 prestation_reservations
          const prestaBoutique = (prestationReservations || []).find(pr => !pr.delivery_address)
          const prestaDomicile = (prestationReservations || []).find(pr => pr.delivery_address)
          const isMixPrestation = !!(prestaBoutique && prestaDomicile)

          await sendDatesUpdateNotification({
            id: order.id,
            reservation_code: order.order_number.toString(),
            customer_name: `${order.customer_infos.firstName} ${order.customer_infos.lastName}`,
            customer_email: order.customer_infos.email,
            customer_phone: order.customer_infos.phone,
            total_amount: order.total_price,
            created_at: order.created_at,
            deposit: firstRental?.deposit || 0,
            caution: firstRental?.caution || 0,
            amountPaid: order.already_paid || 0,
            promoCode: order.promotional_code_name || null,
            promoDiscount: order.promotional_code_discount || null,
            rentalDeliveryAddress: firstRental?.delivery_address || null,
            rentalDeliveryFees: firstRental?.delivery_fees || 0,
            purchaseDeliveryAddress: firstPurchase?.delivery_address || null,
            purchaseDeliveryFees: firstPurchase?.delivery_fees || 0,
            prestationDeliveryAddress: isMixPrestation ? null : (prestationReservations?.[0]?.delivery_address || null),
            prestationDeliveryFees: isMixPrestation ? 0 : (prestationReservations?.[0]?.delivery_fees || 0),
            prestationDomicileDeliveryAddress: isMixPrestation ? (prestaDomicile?.delivery_address || null) : null,
            prestationDomicileDeliveryFees: isMixPrestation ? (prestaDomicile?.delivery_fees || 0) : 0,
            rentalItems: rentalItems?.map((item: Record<string, unknown>) => {
              const product = item.products as { name: string; price: number; new_price?: number }
              const basePrice = product.new_price ?? product.price
              const selectedOptions = getSelectedOptionsFromDB(item.options as never)
              const optionsFees = selectedOptions.reduce((sum, opt) => sum + opt.additional_fee, 0)
              const installationFees = item.needs_installation ? getInstallationFeesFromDB(item.options as never) : 0
              return {
                product_name: product.name,
                quantity: item.quantity as number,
                rental_start: item.rental_start as string,
                rental_end: item.rental_end as string,
                unit_price: basePrice + optionsFees + installationFees,
                total_price: (basePrice + optionsFees + installationFees) * (item.quantity as number),
                selectedOptions,
                personalizations: item.personalizations as { [key: string]: string } | undefined,
                installationFees: installationFees || undefined,
                needsInstallation: item.needs_installation as boolean,
              }
            }),
            purchaseItems: purchaseItems?.map((item: Record<string, unknown>) => {
              const product = item.products as { name: string; price: number; new_price?: number }
              const basePrice = product.new_price ?? product.price
              const selectedOptions = getSelectedOptionsFromDB(item.options as never)
              const optionsFees = selectedOptions.reduce((sum, opt) => sum + opt.additional_fee, 0)
              return {
                product_name: product.name,
                quantity: item.quantity as number,
                estimated_delivery_date: item.estimated_delivery_date as string | undefined,
                unit_price: basePrice + optionsFees,
                total_price: (basePrice + optionsFees) * (item.quantity as number),
                selectedOptions,
                personalizations: item.personalizations as { [key: string]: string } | undefined,
              }
            }),
            prestationItems: prestationItems?.map((item: Record<string, unknown>) => {
              const product = item.products as { name: string; price: number; new_price?: number }
              const basePrice = product.new_price ?? product.price
              const selectedOptions = getSelectedOptionsFromDB(item.options as never)
              const optionsFees = selectedOptions.reduce((sum, opt) => sum + opt.additional_fee, 0)
              return {
                product_name: product.name,
                nb_of_people: (item.nb_of_people as number) || 1,
                prestation_start: item.prestation_start as string | undefined,
                prestation_end: item.prestation_end as string | undefined,
                unit_price: basePrice + optionsFees,
                total_price: (basePrice + optionsFees) * ((item.nb_of_people as number) || 1),
                selectedOptions,
                personalizations: item.personalizations as { [key: string]: string } | undefined,
              }
            }),
          })

          console.log('Email de notification envoyé au client')
        }
      } catch (emailError) {
        console.error('Erreur envoi email de notification:', emailError)
        // Ne pas faire échouer la requête si l'email échoue
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API admin/items/update-dates:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
