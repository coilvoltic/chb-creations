import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code promo invalide' },
        { status: 400 }
      )
    }

    // Normalize code (uppercase, trim whitespace)
    const normalizedCode = code.trim().toUpperCase()

    if (normalizedCode.length === 0) {
      return NextResponse.json(
        { error: 'Code promo invalide' },
        { status: 400 }
      )
    }

    // Query promotional_codes table
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('promotional_codes')
      .select('id, name, discount')
      .eq('name', normalizedCode)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Code promo invalide ou expiré' },
        { status: 404 }
      )
    }

    // Validate discount is in valid range (0-100)
    if (data.discount < 0 || data.discount > 100) {
      console.error(`Invalid discount value for code ${data.name}: ${data.discount}`)
      return NextResponse.json(
        { error: 'Code promo invalide' },
        { status: 500 }
      )
    }

    // Return valid promo code
    return NextResponse.json({
      valid: true,
      promoCode: {
        id: data.id,
        code: data.name,
        discount: data.discount,
      },
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation du code promo' },
      { status: 500 }
    )
  }
}
