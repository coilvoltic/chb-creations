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

// GET /api/admin/promo-messages
export async function GET() {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const { data: messages, error } = await supabase
      .from('promotional_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching promo messages:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

// POST /api/admin/promo-messages
export async function POST(request: NextRequest) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const body = await request.json()
    const { msg } = body

    if (!msg || typeof msg !== 'string' || msg.trim() === '') {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('promotional_messages')
      .insert({ msg: msg.trim() })
      .select()
      .single()

    if (error) {
      console.error('Error creating promo message:', error)
      return NextResponse.json({ error: 'Erreur lors de la création du message' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
