import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Récupérer la session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si pas de session et route admin (sauf login), rediriger vers login
  if (!session && req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  // Si session et route admin/dashboard ou admin/reservations, vérifier que c'est un admin
  if (session && (req.nextUrl.pathname.startsWith('/admin/dashboard') || req.nextUrl.pathname.startsWith('/admin/reservations'))) {
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { user_email: session.user.email })

    if (!isAdmin) {
      // Pas admin, déconnecter et rediriger vers home
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Si déjà connecté et accès à /admin/login, rediriger vers dashboard
  if (session && req.nextUrl.pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
