import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import { getProductBySlug } from '@/actions/products'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'henne-domicile', '/prestations/henne-domicile', '/imgs/prestations/henneDomicileMain.png')
}

export default async function HenneDomicileProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug, 'henne-domicile')

  if (!product || product.is_out_of_stock === true) notFound()
  if (product.images) product.images = [...new Set(product.images)]

  return (
    <ProductDetailPage
      params={params}
      initialProduct={product}
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné à Domicile', href: '/prestations/henne-domicile' },
      ]}
    />
  )
}
