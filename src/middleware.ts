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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fafaf9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      text-align: center;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    p {
      font-size: 16px;
      color: #57534e;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .contact {
      background: white;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .contact h2 {
      font-size: 14px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contact-item {
      margin-bottom: 12px;
    }
    .contact-item:last-child {
      margin-bottom: 0;
    }
    .contact a {
      color: #1c1917;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .contact a:hover {
      color: #78716c;
    }
    .logo {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 48px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CHB CRÉATIONS</div>
    <h1>Site en maintenance</h1>
    <p>Le site est actuellement en maintenance. Nous revenons très bientôt !</p>
    <div class="contact">
      <h2>Nous contacter</h2>
      <div class="contact-item">
        <a href="mailto:chbcreations13@gmail.com">chbcreations13@gmail.com</a>
      </div>
      <div class="contact-item">
        <a href="tel:+33768662910">07 68 66 29 10</a>
      </div>
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fafaf9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      text-align: center;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 28px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    p {
      font-size: 16px;
      color: #57534e;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .contact {
      background: white;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .contact h2 {
      font-size: 14px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .contact-item {
      margin-bottom: 12px;
    }
    .contact-item:last-child {
      margin-bottom: 0;
    }
    .contact a {
      color: #1c1917;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }
    .contact a:hover {
      color: #78716c;
    }
    .logo {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 48px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CHB CRÉATIONS</div>
    <h1>Site en maintenance</h1>
    <p>Le site est actuellement en maintenance. Nous revenons très bientôt !</p>
    <div class="contact">
      <h2>Nous contacter</h2>
      <div class="contact-item">
        <a href="mailto:chbcreations13@gmail.com">chbcreations13@gmail.com</a>
      </div>
      <div class="contact-item">
        <a href="tel:+33768662910">07 68 66 29 10</a>
      </div>
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
