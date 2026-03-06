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

// PATCH /api/admin/promo-codes/[id] - Modifier un code promo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const { id } = await params
    const promoId = parseInt(id)
    if (isNaN(promoId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { name, discount } = body

    const updates: { name?: string; discount?: number } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Le nom du code promo est requis' }, { status: 400 })
      }
      updates.name = name.trim().toUpperCase()
    }

    if (discount !== undefined) {
      if (typeof discount !== 'number' || discount < 1 || discount > 100) {
        return NextResponse.json({ error: 'La réduction doit être un entier entre 1 et 100' }, { status: 400 })
      }
      updates.discount = Math.round(discount)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 })
    }

    const { data: promoCode, error } = await supabase
      .from('promotional_codes')
      .update(updates)
      .eq('id', promoId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Un code promo avec ce nom existe déjà' }, { status: 409 })
      }
      console.error('Error updating promo code:', error)
      return NextResponse.json({ error: 'Erreur lors de la modification du code promo' }, { status: 500 })
    }

    if (!promoCode) {
      return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 })
    }

    return NextResponse.json({ promoCode })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

// DELETE /api/admin/promo-codes/[id] - Supprimer un code promo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
    }

    const { id } = await params
    const promoId = parseInt(id)
    if (isNaN(promoId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const { error } = await supabase
      .from('promotional_codes')
      .delete()
      .eq('id', promoId)

    if (error) {
      console.error('Error deleting promo code:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression du code promo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
