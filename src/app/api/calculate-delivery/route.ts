import { NextRequest, NextResponse } from 'next/server'

const SHOP_ADDRESS = '100 Boulevard de Saint-Loup, 13010 Marseille, France'
const COST_PER_KM = 1 // 1€ par km

export async function POST(request: NextRequest) {
  try {
    const { deliveryAddress, baseDeliveryFees } = await request.json()

    console.log('Calcul livraison - Adresse:', deliveryAddress, 'Base fees:', baseDeliveryFees)

    if (!deliveryAddress || baseDeliveryFees === undefined) {
      return NextResponse.json(
        { error: 'Adresse de livraison et frais de base requis' },
        { status: 400 }
      )
    }

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
          address: SHOP_ADDRESS,
        },
        destination: {
          address: deliveryAddress,
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
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

    // Calculer les frais: frais de base + (distance en km × 1€)
    const totalDeliveryFees = baseDeliveryFees + distanceInKm * COST_PER_KM

    return NextResponse.json({
      distance: distanceInKm,
      distanceText: `${distanceInKm.toFixed(1)} km`,
      duration: `${durationMinutes} min`,
      baseDeliveryFees,
      distanceFees: distanceInKm * COST_PER_KM,
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
