import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // Pour chaque rental_reservation, récupérer ses items
    const rentalReservationsWithItems = await Promise.all(
      (rentalReservations || []).map(async (reservation) => {
        const { data: items, error: itemsError } = await supabase
          .from('rental_items')
          .select(`
            *,
            products (
              name,
              slug,
              images,
              price,
              new_price
            )
          `)
          .eq('rental_reservation_id', reservation.id)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Erreur récupération rental_items:', itemsError)
        }

        return {
          ...reservation,
          items: items || [],
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

    // Pour chaque purchase_reservation, récupérer ses items
    const purchaseReservationsWithItems = await Promise.all(
      (purchaseReservations || []).map(async (reservation) => {
        const { data: items, error: itemsError } = await supabase
          .from('purchase_items')
          .select(`
            *,
            products (
              name,
              slug,
              images,
              price,
              new_price
            )
          `)
          .eq('purchase_reservation_id', reservation.id)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Erreur récupération purchase_items:', itemsError)
        }

        return {
          ...reservation,
          items: items || [],
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

    // Pour chaque prestation_reservation, récupérer ses items
    const prestationReservationsWithItems = await Promise.all(
      (prestationReservations || []).map(async (reservation) => {
        const { data: items, error: itemsError } = await supabase
          .from('prestation_items')
          .select(`
            *,
            products (
              name,
              slug,
              images,
              price,
              new_price
            )
          `)
          .eq('prestation_reservation_id', reservation.id)
          .order('id', { ascending: true })

        if (itemsError) {
          console.error('Erreur récupération prestation_items:', itemsError)
        }

        return {
          ...reservation,
          items: items || [],
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

    // Validation du body
    if (!body.new_status) {
      return NextResponse.json({
        error: 'Paramètres manquants. Requis: new_status'
      }, { status: 400 })
    }

    const { new_status } = body

    // Valider le statut
    const validStatuses = ['CONFIRMED', 'CONFIRMED_NO_DEPOSIT', 'DONE', 'CANCELLED']
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({
        error: `new_status invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
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

    // Mettre à jour TOUTES les sous-réservations de cette commande
    const updates = []
    const errors = []

    console.log(`[PATCH] Updating order ${id} to status: ${new_status}`)

    // Mettre à jour rental_reservations
    const { data: rentalData, error: rentalError } = await supabase
      .from('rental_reservations')
      .update({ reservation_status: new_status })
      .eq('customer_order_id', id)
      .select()

    console.log(`[PATCH] rental_reservations update result:`, {
      data: rentalData,
      error: rentalError,
      rowCount: rentalData?.length || 0
    })

    if (rentalError) {
      console.error('Erreur mise à jour rental_reservations:', rentalError)
      errors.push({ table: 'rental_reservations', error: rentalError.message })
    } else {
      updates.push('rental_reservations')
    }

    // Mettre à jour purchase_reservations
    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchase_reservations')
      .update({ reservation_status: new_status })
      .eq('customer_order_id', id)
      .select()

    console.log(`[PATCH] purchase_reservations update result:`, {
      data: purchaseData,
      error: purchaseError,
      rowCount: purchaseData?.length || 0
    })

    if (purchaseError) {
      console.error('Erreur mise à jour purchase_reservations:', purchaseError)
      errors.push({ table: 'purchase_reservations', error: purchaseError.message })
    } else {
      updates.push('purchase_reservations')
    }

    // Mettre à jour prestation_reservations
    const { data: prestationData, error: prestationError } = await supabase
      .from('prestation_reservations')
      .update({ reservation_status: new_status })
      .eq('customer_order_id', id)
      .select()

    console.log(`[PATCH] prestation_reservations update result:`, {
      data: prestationData,
      error: prestationError,
      rowCount: prestationData?.length || 0
    })

    if (prestationError) {
      console.error('Erreur mise à jour prestation_reservations:', prestationError)
      errors.push({ table: 'prestation_reservations', error: prestationError.message })
    } else {
      updates.push('prestation_reservations')
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
      message: `Statut mis à jour avec succès: ${new_status}`,
      updatedTables: updates,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Erreur API PATCH admin/reservations/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
