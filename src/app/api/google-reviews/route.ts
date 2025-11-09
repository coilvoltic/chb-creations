import { NextResponse } from 'next/server'

interface GoogleReview {
  authorAttribution?: {
    displayName?: string
    photoUri?: string
  }
  rating?: number
  relativePublishTimeDescription?: string
  originalText?: {
    text?: string
  }
  text?: {
    text?: string
  }
  publishTime?: string
}

interface TransformedReview {
  id: number
  name: string
  rating: number
  date: string
  comment: string
  avatar?: string
  publishTime: string
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACE_ID

    if (!apiKey || !placeId) {
      return NextResponse.json(
        { error: 'API key or Place ID not configured' },
        { status: 500 }
      )
    }

    // Use the new Places API (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,reviews'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Google API error:', errorData)
      throw new Error(`Failed to fetch reviews: ${response.status}`)
    }

    const data = await response.json()

    // Transform reviews to match our format and sort by publish time (most recent first)
    const reviews = (data.reviews as GoogleReview[] | undefined)
      ?.map((review: GoogleReview, index: number): TransformedReview => ({
        id: index + 1,
        name: review.authorAttribution?.displayName || 'Utilisateur Google',
        rating: review.rating || 5,
        date: review.relativePublishTimeDescription || 'Récemment',
        comment: review.originalText?.text || review.text?.text || '',
        avatar: review.authorAttribution?.photoUri,
        publishTime: review.publishTime || ''
      }))
      .sort((a: TransformedReview, b: TransformedReview) => {
        // Sort by publishTime descending (most recent first)
        return b.publishTime.localeCompare(a.publishTime)
      })
      .map((review: TransformedReview, index: number): TransformedReview => ({
        ...review,
        id: index + 1 // Re-assign IDs after sorting
      })) || []

    return NextResponse.json({
      reviews,
      rating: data.rating,
      name: data.displayName?.text || 'CHB Créations'
    })
  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
