import { NextRequest, NextResponse } from 'next/server'

interface RelayPoint {
  id: string
  name: string
  address: string
  distance: number // en km
  provider: 'chronopost' | 'mondialrelay'
}

// Points relais fictifs (à remplacer par les vraies APIs Chronopost/Mondial Relay)
const mockRelayPointsDatabase: Record<'chronopost' | 'mondialrelay', Omit<RelayPoint, 'distance'>[]> = {
  chronopost: [
    { id: 'chrono-1', name: 'Chronopost - Bureau de Tabac Le National', address: '5 Rue de la République, 13001 Marseille', provider: 'chronopost' },
    { id: 'chrono-2', name: 'Chronopost - Pressing du Vieux Port', address: '12 Quai du Port, 13002 Marseille', provider: 'chronopost' },
    { id: 'chrono-3', name: 'Chronopost - Pharmacie Saint-Charles', address: '45 Boulevard d\'Athènes, 13001 Marseille', provider: 'chronopost' },
  ],
  mondialrelay: [
    { id: 'mondial-1', name: 'Mondial Relay - Épicerie du Cours', address: '8 Cours Julien, 13006 Marseille', provider: 'mondialrelay' },
    { id: 'mondial-2', name: 'Mondial Relay - Pressing de la Canebière', address: '23 La Canebière, 13001 Marseille', provider: 'mondialrelay' },
    { id: 'mondial-3', name: 'Mondial Relay - Boutique du Cours', address: '67 Cours Belsunce, 13001 Marseille', provider: 'mondialrelay' },
    { id: 'mondial-4', name: 'Mondial Relay - Tabac de la Joliette', address: '15 Place de la Joliette, 13002 Marseille', provider: 'mondialrelay' },
  ],
}

export async function POST(request: NextRequest) {
  try {
    const { customerAddress, provider } = await request.json()

    if (!customerAddress || !provider) {
      return NextResponse.json(
        { error: 'Adresse client et transporteur requis' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Google non configurée' },
        { status: 500 }
      )
    }

    // Récupérer les points relais du transporteur sélectionné
    const relayPoints = mockRelayPointsDatabase[provider as 'chronopost' | 'mondialrelay']

    if (!relayPoints || relayPoints.length === 0) {
      return NextResponse.json({ relayPoints: [] })
    }

    // Calculer la distance pour chaque point relais en utilisant l'API Routes
    const relayPointsWithDistances: RelayPoint[] = await Promise.all(
      relayPoints.map(async (point) => {
        try {
          // Appeler l'API Google Routes pour calculer la distance
          const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes`

          const routesResponse = await fetch(routesUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
            },
            body: JSON.stringify({
              origin: {
                address: customerAddress
              },
              destination: {
                address: point.address
              },
              travelMode: 'DRIVE',
              languageCode: 'fr',
              units: 'METRIC'
            })
          })

          const routesData = await routesResponse.json()

          let distance = 0

          if (routesData.routes && routesData.routes.length > 0) {
            // Convertir la distance de mètres en kilomètres
            distance = routesData.routes[0].distanceMeters / 1000
          }

          return {
            ...point,
            distance: parseFloat(distance.toFixed(1))
          }
        } catch (error) {
          console.error(`Erreur calcul distance pour ${point.name}:`, error)
          return {
            ...point,
            distance: 0
          }
        }
      })
    )

    // Trier par distance croissante
    relayPointsWithDistances.sort((a, b) => a.distance - b.distance)

    return NextResponse.json({ relayPoints: relayPointsWithDistances })
  } catch (error) {
    console.error('Erreur API find-relay-points:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
