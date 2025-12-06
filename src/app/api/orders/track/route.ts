import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API endpoint for order tracking
export async function POST(request: NextRequest) {
  try {
    const { email, orderNumber } = await request.json()

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: 'Email et numéro de commande requis' },
        { status: 400 }
      )
    }

    // Create Supabase client with service_role key for secure access
    // This is safe because:
    // 1. This code runs server-side only (never exposed to client)
    // 2. We validate email matches order before returning data
    // 3. Users can only access their own orders
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

    // 1. Récupérer la commande principale
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // 2. Vérifier que l'email correspond
    const customerEmail = order.customer_infos?.email
    if (!customerEmail || customerEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email incorrect pour cette commande' },
        { status: 403 }
      )
    }

    // 3. Récupérer les réservations associées (rentals)
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

    // 4. Récupérer les réservations d'achats (purchases)
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

    // 5. Récupérer les réservations de prestations (prestations)
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

    // 6. Construire la réponse complète
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.order_number,
        totalPrice: order.total_price,
        createdAt: order.created_at,
        customerInfo: order.customer_infos,
        promoCode: order.promotional_code_name || null,
        promoDiscount: order.promotional_code_discount || null,
      },
      rentalReservations: rentalReservations || [],
      purchaseReservations: purchaseReservations || [],
      prestationReservations: prestationReservations || [],
    })
  } catch (error) {
    console.error('Erreur API /api/orders/track:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
