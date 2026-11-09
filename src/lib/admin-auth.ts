import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Vérifie que la requête provient d'un admin connecté.
 * Même logique que les routes admin déjà protégées (promo-codes, settings…) :
 * lit le cookie Supabase `sb-…-auth-token`, valide le token via `getUser`,
 * puis vérifie le rôle via la fonction SQL `is_admin`.
 *
 * Retourne un client Supabase service_role si l'utilisateur est admin, sinon null.
 */
export async function getAdminClient(): Promise<SupabaseClient | null> {
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

/** Réponse 401 standard pour les routes admin. */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 })
}
