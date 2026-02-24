import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chb-creations.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/panier', '/panier/*', '/compte', '/maintenance'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
