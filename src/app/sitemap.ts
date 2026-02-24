import type { MetadataRoute } from 'next'
import { getProductsBySubcategory } from '@/actions/products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://chb-creations.com'

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/locations`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/accessoires-personnalises`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/prestations`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.7 },
  ]

  // Définition des catégories
  const categories = [
    { path: '/locations/art-de-table', subcategory: 'art-de-table', category: 'locations' },
    { path: '/locations/trones', subcategory: 'trones', category: 'locations' },
    { path: '/locations/deco-et-accessoires', subcategory: 'deco-et-accessoires', category: 'locations' },
    { path: '/accessoires-personnalises/bougies', subcategory: 'bougies', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/certificats-mariage', subcategory: 'certificats-mariage', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/coussins', subcategory: 'coussins', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/tableaux', subcategory: 'tableaux', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/textile', subcategory: 'textile', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/bendir', subcategory: 'bendir', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/faire-parts', subcategory: 'faire-parts', category: 'accessoires-personnalises' },
    { path: '/accessoires-personnalises/oeufs', subcategory: 'oeufs', category: 'accessoires-personnalises' },
    { path: '/prestations/henne-boutique', subcategory: 'henne-boutique', category: 'prestations' },
    { path: '/prestations/henne-domicile', subcategory: 'henne-domicile', category: 'prestations' },
  ]

  // Pages catégories
  const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${baseUrl}${c.path}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Pages produits dynamiques
  const productPages: MetadataRoute.Sitemap = []
  for (const cat of categories) {
    const products = await getProductsBySubcategory(cat.subcategory, cat.category)
    for (const product of products) {
      if (!product.is_out_of_stock) {
        productPages.push({
          url: `${baseUrl}${cat.path}/${product.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      }
    }
  }

  return [...staticPages, ...categoryPages, ...productPages]
}
