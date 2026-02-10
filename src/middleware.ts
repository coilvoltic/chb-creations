import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // ========================================
  // SECTION 1: Mode Maintenance
  // ========================================
  // Chemins exclus de la vérification de maintenance
  const maintenanceExcludedPaths = [
    '/admin',
    '/maintenance',
    '/_next',
    '/favicon.ico',
    '/imgs',
  ]

  const isExcluded = maintenanceExcludedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  // Désactiver le mode maintenance en développement local
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (!isExcluded && !isDevelopment) {
    try {
      // Vérifier le mode maintenance
      const { data: maintenanceStatus } = await supabase
        .rpc('get_maintenance_status')
        .single()

      if ((maintenanceStatus as { is_maintenance: boolean })?.is_maintenance) {
        // Vérifier si l'utilisateur est admin
        const { data: { session } } = await supabase.auth.getSession()

        let isUserAdmin = false
        if (session?.user?.email) {
          const { data: isAdmin } = await supabase
            .rpc('is_admin', { user_email: session.user.email })
          isUserAdmin = isAdmin || false
        }

        // Si pas admin, rediriger vers page de maintenance
        if (!isUserAdmin) {
          return NextResponse.redirect(new URL('/maintenance', req.url))
        }
      }
    } catch (error) {
      console.error('Erreur vérification maintenance:', error)
      // En cas d'erreur, continuer normalement
    }
  }

  // ========================================
  // SECTION 2: Protection routes admin
  // ========================================
  // Ne s'exécute QUE pour les routes /admin/*
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Permettre l'accès à /admin/login sans vérification
    if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin') {
      return res
    }

    // Pour les autres routes admin, vérifier la session
    try {
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

  // Pour toutes les autres routes (non-admin), continuer normalement
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico|admin).*)'],
}
