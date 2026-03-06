import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function getAdminClient() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const authCookie = allCookies.find(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  if (!authCookie?.value) return null

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
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !user) return null

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_email: user.email })
  if (!isAdmin) return null

  return supabase
}

// GET /api/admin/promo-codes - Récupérer tous les codes promos
export async function GET() {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const { data: promoCodes, error } = await supabase
      .from('promotional_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promo codes:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des codes promos' }, { status: 500 })
    }

    return NextResponse.json({ promoCodes })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

// POST /api/admin/promo-codes - Créer un nouveau code promo
export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, discount } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom du code promo est requis' }, { status: 400 })
    }

    if (discount === undefined || discount === null || typeof discount !== 'number' || discount < 1 || discount > 100) {
      return NextResponse.json({ error: 'La réduction doit être un entier entre 1 et 100' }, { status: 400 })
    }

    const { data: promoCode, error } = await supabase
      .from('promotional_codes')
      .insert({ name: name.trim().toUpperCase(), discount: Math.round(discount) })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Un code promo avec ce nom existe déjà' }, { status: 409 })
      }
      console.error('Error creating promo code:', error)
      return NextResponse.json({ error: 'Erreur lors de la création du code promo' }, { status: 500 })
    }

    return NextResponse.json({ promoCode }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
