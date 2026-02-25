import type { Metadata } from 'next'
import { getProductBySlug } from '@/actions/products'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://chb-creations.com'
const DEFAULT_DESCRIPTION = 'Accessoires personnalisés, henné et location de décoration pour vos événements à Marseille'

/**
 * Génère les metadata pour les pages produit dynamiques [slug].
 */
export async function generateProductMetadata(
  slug: string,
  subcategory: string,
  categoryPath: string,
  fallbackImage?: string // Chemin /public utilisé si le produit n'a pas d'image Supabase
): Promise<Metadata> {
  const product = await getProductBySlug(slug, subcategory)

  if (!product) {
    return {
      title: 'Produit non trouvé',
      description: DEFAULT_DESCRIPTION,
    }
  }

  const description = product.description
    ? product.description.replace(/[#*_~`[\]()]/g, '').slice(0, 155).replace(/\s+\S*$/, '...')
    : DEFAULT_DESCRIPTION
  const url = `${BASE_URL}${categoryPath}/${product.slug}`
  const ogImage = fallbackImage ? `${BASE_URL}${fallbackImage}` : undefined

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url,
      ...(ogImage && {
        images: [{ url: ogImage, alt: product.name }],
      }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * Construit des metadata statiques pour les pages non-produit.
 */
export function buildStaticMetadata(opts: {
  title: string
  description: string
  path: string
  image?: string // Chemin relatif depuis /public (ex: '/imgs/prestations/prestationsMain.jpeg')
}): Metadata {
  const url = `${BASE_URL}${opts.path}`
  const ogImage = opts.image ? `${BASE_URL}${opts.image}` : undefined
  return {
    title: opts.title,
    description: opts.description,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      ...(ogImage && { images: [{ url: ogImage, alt: opts.title }] }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: opts.title,
      description: opts.description,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: {
      canonical: url,
    },
  }
}
