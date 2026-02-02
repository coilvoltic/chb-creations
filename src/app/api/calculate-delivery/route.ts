import { NextRequest, NextResponse } from 'next/server'
import { SHOP_CONFIG, DELIVERY_CONFIG, GOOGLE_CONFIG } from '@/config/constants'
import { calculateDeliverySchema } from '@/lib/validators'
import type { Category } from '@/config/constants'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = calculateDeliverySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { deliveryAddress, category } = validationResult.data

    console.log('Calcul livraison - Adresse:', deliveryAddress, 'Catégorie:', category)

    const baseDeliveryFees = DELIVERY_CONFIG.baseFees[category as Category]

    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      console.error('Clé API Google manquante')
      return NextResponse.json(
        { error: 'Clé API Google manquante' },
        { status: 500 }
      )
    }

    // Utiliser l'API Routes de Google
    const url = 'https://routes.googleapis.com/directions/v2:computeRoutes'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: {
          address: SHOP_CONFIG.address,
        },
        destination: {
          address: deliveryAddress,
        },
        travelMode: GOOGLE_CONFIG.routes.travelMode,
        routingPreference: GOOGLE_CONFIG.routes.routingPreference,
        computeAlternativeRoutes: false,
        languageCode: 'fr',
        units: 'METRIC',
      }),
    })

    const data = await response.json()

    console.log('Réponse API Routes:', JSON.stringify(data, null, 2))

    if (!response.ok || !data.routes || data.routes.length === 0) {
      console.error('Erreur API Routes:', data)
      return NextResponse.json(
        { error: 'Impossible de calculer la distance. Vérifiez l\'adresse.' },
        { status: 400 }
      )
    }

    const route = data.routes[0]

    // Distance en mètres
    const distanceInMeters = route.distanceMeters
    // Convertir en kilomètres
    const distanceInKm = distanceInMeters / 1000

    // Durée en secondes, convertir en minutes
    const durationSeconds = parseInt(route.duration.replace('s', ''))
    const durationMinutes = Math.round(durationSeconds / 60)

    // Calculer les frais: frais de base + (distance en km × coût par km)
    const totalDeliveryFees = baseDeliveryFees + distanceInKm * DELIVERY_CONFIG.costPerKm

    return NextResponse.json({
      distance: distanceInKm,
      distanceText: `${distanceInKm.toFixed(1)} km`,
      duration: `${durationMinutes} min`,
      baseDeliveryFees,
      distanceFees: distanceInKm * DELIVERY_CONFIG.costPerKm,
      totalDeliveryFees: parseFloat(totalDeliveryFees.toFixed(2)),
    })
  } catch (error) {
    console.error('Erreur calcul livraison:', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des frais de livraison' },
      { status: 500 }
    )
  }
}
