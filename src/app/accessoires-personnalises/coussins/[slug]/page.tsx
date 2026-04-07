import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import { getProductBySlug } from '@/actions/products'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'coussins', '/accessoires-personnalises/coussins', '/imgs/accessoires-personnalises/coussinMain.jpeg')
}

export default async function CoussinsProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug, 'coussins')

  if (!product || product.is_out_of_stock === true) notFound()
  if (product.images) product.images = [...new Set(product.images)]

  return (
    <ProductDetailPage
      params={params}
      initialProduct={product}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Coussins', href: '/accessoires-personnalises/coussins' },
      ]}
    />
  )
}
