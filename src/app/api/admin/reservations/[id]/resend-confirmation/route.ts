import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendReservationConfirmation } from '@/lib/email'
import { getSelectedOptionsFromDB, getInstallationFeesFromDB } from '@/lib/reservation-utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()

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

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('customer_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Récupérer toutes les sous-réservations avec items et produits
    const [
      { data: rentalReservations },
      { data: purchaseReservations },
      { data: prestationReservations },
    ] = await Promise.all([
      supabase
        .from('rental_reservations')
        .select('*')
        .eq('customer_order_id', id),
      supabase
        .from('purchase_reservations')
        .select('*')
        .eq('customer_order_id', id),
      supabase
        .from('prestation_reservations')
        .select('*')
        .eq('customer_order_id', id),
    ])

    // Récupérer les items avec les produits
    const firstRental = rentalReservations?.[0]
    const firstPurchase = purchaseReservations?.[0]
    const firstPrestation = prestationReservations?.[0]

    const [
      { data: rentalItemsDB },
      { data: purchaseItemsDB },
      { data: prestationItemsDB },
    ] = await Promise.all([
      firstRental
        ? supabase.from('rental_items').select('*, products(name, price, new_price)').eq('rental_reservation_id', firstRental.id)
        : Promise.resolve({ data: [] }),
      firstPurchase
        ? supabase.from('purchase_items').select('*, products(name, price, new_price)').eq('purchase_reservation_id', firstPurchase.id)
        : Promise.resolve({ data: [] }),
      firstPrestation
        ? supabase.from('prestation_items').select('*, products(name, price, new_price)').eq('prestation_reservation_id', firstPrestation.id)
        : Promise.resolve({ data: [] }),
    ])

    // Construire les items pour l'email (même format que lors de la création)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rentalItems = (rentalItemsDB || []).map((item: any) => {
      const selectedOptions = getSelectedOptionsFromDB(item.options)
      const installationFees = getInstallationFeesFromDB(item.options)
      const unitPrice = item.products?.new_price ?? item.products?.price ?? 0
      const optionsFees = selectedOptions.reduce((sum: number, opt: any) => sum + opt.additional_fee, 0)
      const installFee = item.needs_installation ? installationFees : 0

      return {
        product_name: item.products?.name || 'Produit inconnu',
        quantity: item.quantity,
        rental_start: item.rental_start,
        rental_end: item.rental_end,
        unit_price: unitPrice,
        total_price: (unitPrice + optionsFees + installFee) * item.quantity,
        selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
        personalizations: item.personalizations || undefined,
        installationFees: installationFees > 0 ? installationFees : undefined,
        needsInstallation: item.needs_installation || undefined,
      }
    })

    const purchaseItems = (purchaseItemsDB || []).map((item: any) => {
      const selectedOptions = getSelectedOptionsFromDB(item.options)
      const unitPrice = item.products?.new_price ?? item.products?.price ?? 0
      const optionsFees = selectedOptions.reduce((sum: number, opt: any) => sum + opt.additional_fee, 0)

      return {
        product_name: item.products?.name || 'Produit inconnu',
        quantity: item.quantity,
        estimated_delivery_date: item.estimated_delivery_date || undefined,
        unit_price: unitPrice,
        total_price: (unitPrice + optionsFees) * item.quantity,
        selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
        personalizations: item.personalizations || undefined,
      }
    })

    const prestationItems = (prestationItemsDB || []).map((item: any) => {
      const selectedOptions = getSelectedOptionsFromDB(item.options)
      const unitPrice = item.products?.new_price ?? item.products?.price ?? 0
      const optionsFees = selectedOptions.reduce((sum: number, opt: any) => sum + opt.additional_fee, 0)

      return {
        product_name: item.products?.name || 'Produit inconnu',
        nb_of_people: item.nb_of_people || 1,
        prestation_start: item.prestation_start || undefined,
        prestation_end: item.prestation_end || undefined,
        unit_price: unitPrice,
        total_price: (unitPrice + optionsFees) * (item.nb_of_people || 1),
        selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
        personalizations: item.personalizations || undefined,
      }
    })
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Construire les données email (même structure que dans /api/reservations/create)
    const emailData = {
      id: order.id,
      reservation_code: String(order.order_number),
      customer_name: `${order.customer_infos.firstName} ${order.customer_infos.lastName}`,
      customer_email: order.customer_infos.email,
      customer_phone: order.customer_infos.phone,
      total_amount: order.total_price,
      created_at: order.created_at,
      rentalItems: rentalItems.length > 0 ? rentalItems : undefined,
      purchaseItems: purchaseItems.length > 0 ? purchaseItems : undefined,
      prestationItems: prestationItems.length > 0 ? prestationItems : undefined,
      rentalDeliveryAddress: firstRental?.delivery_address || null,
      rentalDeliveryFees: firstRental?.delivery_fees || 0,
      purchaseDeliveryAddress: firstPurchase?.delivery_address || null,
      purchaseDeliveryFees: firstPurchase?.delivery_fees || 0,
      prestationDeliveryAddress: firstPrestation?.delivery_address || null,
      prestationDeliveryFees: firstPrestation?.delivery_fees || 0,
      deposit: order.already_paid || firstRental?.deposit || 0,
      caution: firstRental?.caution || 0,
      amountPaid: order.already_paid || 0,
      paymentType: (order.already_paid && order.already_paid >= order.total_price) ? 'full' as const
        : (order.already_paid && order.already_paid > 0) ? 'deposit' as const
        : 'cash' as const,
      promoCode: order.promotional_code_name || null,
      promoDiscount: order.promotional_code_discount || null,
    }

    await sendReservationConfirmation(emailData)

    return NextResponse.json({
      success: true,
      message: `Email de confirmation renvoyé à ${order.customer_infos.email}`,
    })
  } catch (error) {
    console.error('Erreur renvoi email confirmation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
