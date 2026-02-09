import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface MaintenanceStatus {
  is_maintenance: boolean
  message: string
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // ========================================
  // SECTION 1: Mode Maintenance
  // ========================================
  // Chemins exclus de la vérification de maintenance
  const maintenanceExcludedPaths = [
    '/admin',
    '/_next',
    '/favicon.ico',
    '/imgs',
  ]

  const isExcluded = maintenanceExcludedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (!isExcluded) {
    try {
      // Vérifier le mode maintenance
      const { data: maintenanceStatus } = await supabase
        .rpc('get_maintenance_status')
        .single()

      const status = maintenanceStatus as MaintenanceStatus

      if (status?.is_maintenance) {
        // Vérifier si l'utilisateur est admin
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user?.email) {
          const { data: isAdmin } = await supabase
            .rpc('is_admin', { user_email: session.user.email })

          // Si pas admin, afficher message de maintenance simple
          if (!isAdmin) {
            return new NextResponse(
              `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance - CHB Créations</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    p {
      font-size: 18px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .contact {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
    }
    .contact a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Site en maintenance</h1>
    <p>${status.message || 'Le site est actuellement en maintenance. Nous revenons bientôt !'}</p>
    <div class="contact">
      <p><strong>Besoin de nous contacter ?</strong></p>
      <p>Email: <a href="mailto:chbcreations13@gmail.com">chbcreations13@gmail.com</a></p>
      <p>Téléphone: <a href="tel:+33768662910">07 68 66 29 10</a></p>
    </div>
  </div>
</body>
</html>`,
              {
                status: 503,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Retry-After': '3600',
                },
              }
            )
          }
        } else {
          // Pas de session, afficher page de maintenance
          return new NextResponse(
            `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance - CHB Créations</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 20px;
    }
    p {
      font-size: 18px;
      color: #4a5568;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .contact {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
    }
    .contact a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Site en maintenance</h1>
    <p>${status.message || 'Le site est actuellement en maintenance. Nous revenons bientôt !'}</p>
    <div class="contact">
      <p><strong>Besoin de nous contacter ?</strong></p>
      <p>Email: <a href="mailto:chbcreations13@gmail.com">chbcreations13@gmail.com</a></p>
      <p>Téléphone: <a href="tel:+33768662910">07 68 66 29 10</a></p>
    </div>
  </div>
</body>
</html>`,
            {
              status: 503,
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Retry-After': '3600',
              },
            }
          )
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

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
