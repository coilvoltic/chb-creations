import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID requis' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les commandes de l'utilisateur
    const { data: orders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Pour chaque commande, récupérer toutes les réservations avec leurs items et infos produit
    const ordersWithDetails = await Promise.all(
      (orders || []).map(async (order) => {
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

        return {
          ...order,
          rental_reservations: rentalReservationsWithItems,
          purchase_reservations: purchaseReservationsWithItems,
          prestation_reservations: prestationReservationsWithItems,
        }
      })
    )

    return NextResponse.json({ orders: ordersWithDetails })
  } catch (error) {
    console.error('Erreur API user/orders:', error)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
