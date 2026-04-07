import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import { getProductBySlug } from '@/actions/products'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'bougies', '/accessoires-personnalises/bougies', '/imgs/accessoires-personnalises/bougiesMain.png')
}

export default async function BougiesProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug, 'bougies')

  if (!product || product.is_out_of_stock === true) notFound()
  if (product.images) product.images = [...new Set(product.images)]

  return (
    <ProductDetailPage
      params={params}
      initialProduct={product}
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/accessoires-personnalises' },
        { label: 'Bougies', href: '/accessoires-personnalises/bougies' },
      ]}
    />
  )
}
