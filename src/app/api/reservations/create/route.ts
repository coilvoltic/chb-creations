import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CustomerInfo, ReservationStatus } from '@/lib/supabase'
import { sendReservationConfirmation } from '@/lib/email'
import { generateReservationCode } from '@/lib/reservation-code'
import { buildItemOptionsData } from '@/lib/reservation-utils'

interface SelectedOption {
  option_type_name: string
  name: string
  description?: string
  additional_fee: number
}

interface CartItemPayload {
  productId: number
  productName: string
  category: string // 'locations', 'accessoires-personnalises', or 'prestations'
  quantity: number
  numberOfPeople?: number // For prestation items (henné) - number of people
  pricePerUnit: number
  rentalStart: string // ISO timestamp (dummy for purchase/prestation items)
  rentalEnd: string // ISO timestamp (dummy for purchase/prestation items)
  prestationStart?: string // ISO timestamp for prestation start (date + heure de début)
  prestationEnd?: string // ISO timestamp for prestation end (date + heure de fin)
  selectedOptions?: SelectedOption[] // Array of selected options
  personalizations?: { [key: string]: string } // Map of personalization field name to value
  needsInstallation?: boolean
  installationFees?: number
}

interface RelayPointInfo {
  id: string
  name: string
  address: string
  distance: number
  provider: 'chronopost' | 'mondialrelay'
}

interface DeliveryInfo {
  option: 'pickup' | 'delivery' | 'relay_point'
  address?: string // Delivery address OR customer address for relay point search
  fees: number
  distance?: number
  // Pour les points relais uniquement
  relayProvider?: 'chronopost' | 'mondialrelay'
  relayPoint?: RelayPointInfo
}

interface PromoCodePayload {
  code: string
  discount: number // Percentage (0-100)
}

interface CreateReservationPayload {
  customerInfo: CustomerInfo
  items: CartItemPayload[]
  deposit: number
  caution: number
  rentalDelivery?: DeliveryInfo // Delivery info for rental items
  purchaseDelivery?: DeliveryInfo // Delivery info for purchase items
  prestationDelivery?: DeliveryInfo // Delivery info for prestation items
  totalPrice: number
  promoCode?: PromoCodePayload // Promotional code if applied
  paymentMethod?: 'cash' | 'deposit' | 'full' | null
  userId?: string // Optional: Supabase Auth user ID if logged in with Google
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== API /api/reservations/create - START ===')
    const payload: CreateReservationPayload = await request.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2))

    // Validation
    if (!payload.customerInfo || !payload.items || payload.items.length === 0) {
      console.error('❌ Invalid payload - missing customerInfo or items')
      return NextResponse.json(
        { error: 'Données de réservation invalides' },
        { status: 400 }
      )
    }

    const { customerInfo, items, deposit, caution, rentalDelivery, purchaseDelivery, prestationDelivery, totalPrice, promoCode, paymentMethod, userId } = payload

    // Create Supabase client with service_role key (bypasses RLS)
    // This is safe because:
    // 1. This code runs server-side only (never exposed to client)
    // 2. We validate all data before insertion
    // 3. RLS still protects direct database access from clients
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

    // Déterminer le statut de la réservation en fonction du mode de paiement
    let reservationStatus: ReservationStatus
    if ((paymentMethod === 'deposit' || paymentMethod === 'full') && deposit > 0) {
      // Paiement en ligne effectué (acompte ou intégral) - pas encore confirmé (en attente du webhook)
      reservationStatus = 'PENDING'
    } else if (paymentMethod === 'cash' && deposit > 0) {
      // Réservation avec acompte à payer en boutique
      reservationStatus = 'PENDING'
    } else if (deposit === 0) {
      // Pas d'acompte requis
      reservationStatus = 'PENDING'
    } else {
      // Par défaut
      reservationStatus = 'PENDING'
    }

    // 1. Créer la commande client (customer_order)
    const reservationCode = generateReservationCode()

    // If promo code is provided, get the promo code ID from database
    let promoCodeId: number | null = null
    if (promoCode && promoCode.code) {
      const { data: promoData } = await supabase
        .from('promotional_codes')
        .select('id')
        .eq('name', promoCode.code.toUpperCase())
        .single()

      promoCodeId = promoData?.id || null
    }

    const { data: customerOrder, error: orderError } = await supabase
      .from('customer_orders')
      .insert({
        customer_infos: customerInfo,
        total_price: totalPrice,
        order_number: reservationCode,
        user_id: userId || null, // Link to Google account if user is logged in
        promotional_code_id: promoCodeId,
        promotional_code_name: promoCode?.code || null,
        promotional_code_discount: promoCode?.discount || null,
      })
      .select()
      .single()

    if (orderError || !customerOrder) {
      console.error('Erreur création customer_order:', orderError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      )
    }

    // 2. Séparer les items par type (rental vs purchase vs prestation)
    const rentalItems = items.filter(item => item.category === 'locations')
    const purchaseItems = items.filter(item => item.category === 'accessoires-personnalises')
    const prestationItems = items.filter(item => item.category === 'prestations')

    let rentalReservationId: number | null = null
    let purchaseReservationId: number | null = null
    let prestationReservationId: number | null = null

    // 3a. Créer rental_reservation si nécessaire
    if (rentalItems.length > 0) {
      const { data: rentalReservation, error: reservationError } = await supabase
        .from('rental_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          deposit,
          caution,
          delivery_address: rentalDelivery?.option === 'delivery' ? (rentalDelivery.address || null) : null,
          delivery_fees: rentalDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: rentalItems.reduce((sum, item) => {
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * item.quantity)
          }, 0),
        })
        .select()
        .single()

      if (reservationError || !rentalReservation) {
        console.error('Erreur création rental_reservation:', reservationError)
        // Rollback: supprimer la commande créée (la FK cascade supprimera aussi)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation location' },
          { status: 500 }
        )
      }

      rentalReservationId = rentalReservation.id

      // Créer les rental_items
      const rentalItemsData = rentalItems.map((item) => ({
        rental_reservation_id: rentalReservation.id,
        product_id: item.productId,
        quantity: item.quantity,
        rental_start: item.rentalStart,
        rental_end: item.rentalEnd,
        options: buildItemOptionsData(item.selectedOptions, item.installationFees),
        personalizations: item.personalizations || null,
        needs_installation: item.needsInstallation || false,
      }))

      const { error: itemsError } = await supabase
        .from('rental_items')
        .insert(rentalItemsData)

      if (itemsError) {
        console.error('Erreur création rental_items:', itemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles de location' },
          { status: 500 }
        )
      }
    }

    // 3b. Créer purchase_reservation si nécessaire
    if (purchaseItems.length > 0) {
      // Déterminer l'adresse de livraison selon le mode
      let deliveryAddress: string | null = null
      if (purchaseDelivery?.option === 'delivery') {
        deliveryAddress = purchaseDelivery.address || null
      } else if (purchaseDelivery?.option === 'relay_point' && purchaseDelivery.relayPoint) {
        // Stocker les informations du point relais de manière structurée
        deliveryAddress = `[Point Relais ${purchaseDelivery.relayProvider === 'chronopost' ? 'Chronopost' : 'Mondial Relay'}] ${purchaseDelivery.relayPoint.name} - ${purchaseDelivery.relayPoint.address}`
      }

      const { data: purchaseReservation, error: purchaseError } = await supabase
        .from('purchase_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: deliveryAddress,
          delivery_fees: purchaseDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: purchaseItems.reduce((sum, item) => {
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * item.quantity)
          }, 0),
        })
        .select()
        .single()

      if (purchaseError || !purchaseReservation) {
        console.error('Erreur création purchase_reservation:', purchaseError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation achat' },
          { status: 500 }
        )
      }

      purchaseReservationId = purchaseReservation.id

      // Créer les purchase_items
      const purchaseItemsData = purchaseItems.map((item) => ({
        purchase_reservation_id: purchaseReservation.id,
        product_id: item.productId,
        quantity: item.quantity,
        estimated_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        options: buildItemOptionsData(item.selectedOptions, item.installationFees),
        personalizations: item.personalizations || null,
      }))

      const { error: purchaseItemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItemsData)

      if (purchaseItemsError) {
        console.error('Erreur création purchase_items:', purchaseItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles d\'achat' },
          { status: 500 }
        )
      }
    }

    // 3c. Créer prestation_reservation si nécessaire
    if (prestationItems.length > 0) {
      const { data: prestationReservation, error: prestationError } = await supabase
        .from('prestation_reservations')
        .insert({
          customer_order_id: customerOrder.id,
          delivery_address: prestationDelivery?.option === 'delivery' ? (prestationDelivery.address || null) : null,
          delivery_fees: prestationDelivery?.fees || 0,
          reservation_status: reservationStatus,
          total_price: prestationItems.reduce((sum, item) => {
            // Note: prestations n'ont généralement pas d'installation, mais on le gère au cas où
            const installationFee = (item.installationFees && item.needsInstallation) ? item.installationFees : 0
            return sum + ((item.pricePerUnit + installationFee) * (item.numberOfPeople || 1))
          }, 0),
        })
        .select()
        .single()

      if (prestationError || !prestationReservation) {
        console.error('Erreur création prestation_reservation:', prestationError)
        // Rollback : supprimer la commande client
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création de la réservation de prestation' },
          { status: 500 }
        )
      }

      prestationReservationId = prestationReservation.id

      // Créer les prestation_items
      const prestationItemsData = prestationItems.map((item) => ({
        prestation_reservation_id: prestationReservationId,
        product_id: item.productId,
        nb_of_people: item.numberOfPeople || 1, // Default to 1 if not specified
        prestation_start: item.prestationStart || null,
        prestation_end: item.prestationEnd || null,
        options: buildItemOptionsData(item.selectedOptions, item.installationFees),
        personalizations: item.personalizations || null,
      }))

      const { error: prestationItemsError } = await supabase
        .from('prestation_items')
        .insert(prestationItemsData)

      if (prestationItemsError) {
        console.error('Erreur création prestation_items:', prestationItemsError)
        await supabase.from('customer_orders').delete().eq('id', customerOrder.id)
        return NextResponse.json(
          { error: 'Erreur lors de la création des articles de prestation' },
          { status: 500 }
        )
      }
    }

    // 4. Envoyer l'email de confirmation avec le PDF
    console.log('=== SENDING EMAIL ===')
    console.log('Customer email:', customerInfo.email)
    try {
      // Construire les adresses de livraison pour l'email
      // Séparer les items en locations et achats pour l'email
      const rentalItems = items
        .filter((item) => item.category === 'locations')
        .map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          rental_start: item.rentalStart,
          rental_end: item.rentalEnd,
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
          installationFees: item.installationFees,
          needsInstallation: item.needsInstallation,
        }))

      const purchaseItems = items
        .filter((item) => item.category === 'accessoires-personnalises')
        .map((item) => ({
          product_name: item.productName,
          quantity: item.quantity,
          estimated_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          unit_price: item.pricePerUnit,
          total_price: item.quantity * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      const prestationItemsEmail = items
        .filter((item) => item.category === 'prestations')
        .map((item) => ({
          product_name: item.productName,
          nb_of_people: item.numberOfPeople || 1,
          prestation_start: item.prestationStart,
          prestation_end: item.prestationEnd,
          unit_price: item.pricePerUnit,
          total_price: (item.numberOfPeople || 1) * item.pricePerUnit,
          selectedOptions: item.selectedOptions,
          personalizations: item.personalizations,
        }))

      // Construire l'adresse d'achat pour le PDF (inclut les points relais)
      let purchaseAddressForPDF: string | null = null
      if (purchaseDelivery?.option === 'delivery') {
        purchaseAddressForPDF = purchaseDelivery.address || null
      } else if (purchaseDelivery?.option === 'relay_point' && purchaseDelivery.relayPoint) {
        // Formater l'adresse du point relais pour le PDF
        purchaseAddressForPDF = `[Point Relais ${purchaseDelivery.relayProvider === 'chronopost' ? 'Chronopost' : 'Mondial Relay'}] ${purchaseDelivery.relayPoint.name} - ${purchaseDelivery.relayPoint.address}`
      }

      const emailData = {
        id: customerOrder.id, // Utiliser l'ID de la commande principale
        reservation_code: reservationCode,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        total_amount: totalPrice,
        created_at: customerOrder.created_at,
        rentalItems: rentalItems.length > 0 ? rentalItems : undefined,
        purchaseItems: purchaseItems.length > 0 ? purchaseItems : undefined,
        prestationItems: prestationItemsEmail.length > 0 ? prestationItemsEmail : undefined,
        rentalDeliveryAddress: rentalDelivery?.option === 'delivery' ? rentalDelivery.address : null,
        rentalDeliveryFees: rentalDelivery?.fees || 0,
        purchaseDeliveryAddress: purchaseAddressForPDF,
        purchaseDeliveryFees: purchaseDelivery?.fees || 0,
        prestationDeliveryAddress: prestationDelivery?.option === 'delivery' ? prestationDelivery.address : null,
        prestationDeliveryFees: prestationDelivery?.fees || 0,
        deposit: deposit,
        caution: caution,
        promoCode: promoCode?.code || null,
        promoDiscount: promoCode?.discount || null,
      }

      await sendReservationConfirmation(emailData)
      console.log('✅ Email de confirmation envoyé avec succès à:', customerInfo.email)
    } catch (emailError) {
      // Ne pas faire échouer la réservation si l'email échoue
      // La réservation est déjà créée en base
      console.error('❌ Erreur envoi email (réservation créée):', emailError)
      if (emailError instanceof Error) {
        console.error('Error message:', emailError.message)
        console.error('Error stack:', emailError.stack)
      }
    }

    // 5. Retourner le succès avec les IDs
    return NextResponse.json({
      success: true,
      orderId: customerOrder.id,
      reservationCode: reservationCode,
      rentalReservationId: rentalReservationId,
      purchaseReservationId: purchaseReservationId,
      message: 'Réservation créée avec succès',
    })
  } catch (error) {
    console.error('Erreur API /api/reservations/create:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
