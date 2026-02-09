import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Permettre l'accès à /admin/login sans vérification
  if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin') {
    return res
  }

  // Pour les autres routes admin, vérifier la session
  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si pas de session, rediriger vers login
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    // Si session et route protégée, vérifier que c'est un admin
    if (req.nextUrl.pathname.startsWith('/admin/dashboard') ||
        req.nextUrl.pathname.startsWith('/admin/reservations') ||
        req.nextUrl.pathname.startsWith('/admin/products')) {
      const { data: isAdmin } = await supabase
        .rpc('is_admin', { user_email: session.user.email })

      if (!isAdmin) {
        // Pas admin, déconnecter et rediriger vers home
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // En cas d'erreur, permettre l'accès (éviter les blocages)
    return res
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
