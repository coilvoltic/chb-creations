import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_KEYS = ['boutique_hours_default', 'boutique_hours_exceptions'] as const

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

export async function GET() {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, updated_at')

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des paramètres' }, { status: 500 })
    }

    const settings: Record<string, unknown> = {}
    for (const row of (data || [])) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('Unexpected error in GET /api/admin/settings:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || !(ALLOWED_KEYS as readonly string[]).includes(key)) {
      return NextResponse.json(
        { error: `Clé invalide. Valeurs acceptées : ${ALLOWED_KEYS.join(', ')}` },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ error: 'La valeur est requise' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single()

    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ setting: data })
  } catch (err) {
    console.error('Unexpected error in PUT /api/admin/settings:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
