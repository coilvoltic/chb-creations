import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Numéro de commande et email requis' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rechercher la commande par order_number et vérifier l'email dans customer_infos
    const { data: orders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('order_number', orderNumber)

    if (ordersError) {
      console.error('Erreur récupération commande:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Vérifier qu'on a trouvé une commande
    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Commande introuvable. Vérifiez le numéro de commande.' },
        { status: 404 }
      )
    }

    // Vérifier que l'email correspond
    const order = orders[0]
    const customerEmail = order.customer_infos?.email?.toLowerCase()

    if (customerEmail !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'L\'adresse email ne correspond pas à cette commande.' },
        { status: 403 }
      )
    }

    // Récupérer les détails complets de la commande (même structure que /api/user/orders)
    // Récupérer rental_reservations avec rental_items et produits
    const { data: rentalReservations } = await supabase
      .from('rental_reservations')
      .select('*')
      .eq('customer_order_id', order.id)

    const rentalReservationsWithItems = await Promise.all(
      (rentalReservations || []).map(async (rental) => {
        const { data: rentalItems } = await supabase
          .from('rental_items')
          .select(`
            *,
            products:product_id (
              name,
              images,
              slug,
              category,
              subcategory
            )
          `)
          .eq('rental_reservation_id', rental.id)

        return {
          ...rental,
          rental_items: rentalItems || []
        }
      })
    )

    // Récupérer purchase_reservations avec purchase_items et produits
    const { data: purchaseReservations } = await supabase
      .from('purchase_reservations')
      .select('*')
      .eq('customer_order_id', order.id)

    const purchaseReservationsWithItems = await Promise.all(
      (purchaseReservations || []).map(async (purchase) => {
        const { data: purchaseItems } = await supabase
          .from('purchase_items')
          .select(`
            *,
            products:product_id (
              name,
              images,
              slug,
              category,
              subcategory
            )
          `)
          .eq('purchase_reservation_id', purchase.id)

        return {
          ...purchase,
          purchase_items: purchaseItems || []
        }
      })
    )

    // Récupérer prestation_reservations avec prestation_items et produits
    const { data: prestationReservations } = await supabase
      .from('prestation_reservations')
      .select('*')
      .eq('customer_order_id', order.id)

    const prestationReservationsWithItems = await Promise.all(
      (prestationReservations || []).map(async (prestation) => {
        const { data: prestationItems } = await supabase
          .from('prestation_items')
          .select(`
            *,
            products:product_id (
              name,
              images,
              slug,
              category,
              subcategory
            )
          `)
          .eq('prestation_reservation_id', prestation.id)

        return {
          ...prestation,
          prestation_items: prestationItems || []
        }
      })
    )

    const orderWithDetails = {
      ...order,
      rental_reservations: rentalReservationsWithItems,
      purchase_reservations: purchaseReservationsWithItems,
      prestation_reservations: prestationReservationsWithItems,
    }

    return NextResponse.json({ order: orderWithDetails })
  } catch (error) {
    console.error('Erreur API track-order:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
