import { NextRequest, NextResponse } from 'next/server'

interface PlacePrediction {
  text?: {
    text?: string
  }
  placeId?: string
}

interface Suggestion {
  placePrediction?: PlacePrediction
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input || input.trim().length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Google manquante' },
        { status: 500 }
      )
    }

    // Utiliser la nouvelle API Places (New) - Autocomplete
    const url = 'https://places.googleapis.com/v1/places:autocomplete'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: input,
        languageCode: 'fr',
        includedRegionCodes: ['FR'], // Limiter à la France
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erreur autocomplete:', data)
      return NextResponse.json({ predictions: [] })
    }

    // Retourner les prédictions avec la nouvelle structure
    const predictions = (data.suggestions || []).map((suggestion: Suggestion) => ({
      description: suggestion.placePrediction?.text?.text || '',
      placeId: suggestion.placePrediction?.placeId || '',
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Erreur autocomplete:', error)
    return NextResponse.json({ predictions: [] })
  }
}
