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

// PATCH /api/admin/promo-messages/[id]
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
    const msgId = parseInt(id)
    if (isNaN(msgId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const body = await request.json()
    const { msg } = body

    if (!msg || typeof msg !== 'string' || msg.trim() === '') {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from('promotional_messages')
      .update({ msg: msg.trim() })
      .eq('id', msgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating promo message:', error)
      return NextResponse.json({ error: 'Erreur lors de la modification du message' }, { status: 500 })
    }

    if (!message) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 })
    }

    return NextResponse.json({ message })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}

// DELETE /api/admin/promo-messages/[id]
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
    const msgId = parseInt(id)
    if (isNaN(msgId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const { error } = await supabase
      .from('promotional_messages')
      .delete()
      .eq('id', msgId)

    if (error) {
      console.error('Error deleting promo message:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression du message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
