import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API endpoint to fetch all orders for a user by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Create Supabase client with service_role key for secure access
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

    // 1. Récupérer toutes les commandes de l'utilisateur par email
    // Utiliser l'opérateur ->> pour extraire la valeur JSON en tant que texte
    const { data: orders, error: ordersError } = await supabase
      .from('customer_orders')
      .select('*')
      .ilike('customer_infos->>email', email)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commandes' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    // 2. Pour chaque commande, récupérer les réservations associées
    const ordersWithReservations = await Promise.all(
      orders.map(async (order) => {
        // Récupérer les réservations de location
        const { data: rentalReservations } = await supabase
          .from('rental_reservations')
          .select(`
            *,
            rental_items (
              *,
              products (
                name,
                images,
                slug,
                category,
                subcategory
              )
            )
          `)
          .eq('customer_order_id', order.id)

        // Récupérer les réservations d'achat
        const { data: purchaseReservations } = await supabase
          .from('purchase_reservations')
          .select(`
            *,
            purchase_items (
              *,
              products (
                name,
                images,
                slug,
                category,
                subcategory
              )
            )
          `)
          .eq('customer_order_id', order.id)

        // Récupérer les réservations de prestation
        const { data: prestationReservations } = await supabase
          .from('prestation_reservations')
          .select(`
            *,
            prestation_items (
              *,
              products (
                name,
                images,
                slug,
                category,
                subcategory
              )
            )
          `)
          .eq('customer_order_id', order.id)

        return {
          order: {
            id: order.id,
            orderNumber: order.order_number,
            totalPrice: order.total_price,
            createdAt: order.created_at,
            customerInfo: order.customer_infos,
          },
          rentalReservations: rentalReservations || [],
          purchaseReservations: purchaseReservations || [],
          prestationReservations: prestationReservations || [],
        }
      })
    )

    return NextResponse.json({ orders: ordersWithReservations })
  } catch (error) {
    console.error('Erreur API /api/orders/user:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
