import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import { getProductBySlug } from '@/actions/products'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'certificats-mariage', '/accessoires-personnalises/certificats-mariage', '/imgs/accessoires-personnalises/certificatsMariageMain.png')
}

export default async function CertificatsMariageProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug, 'certificats-mariage')

  if (!product || product.is_out_of_stock === true) notFound()
  if (product.images) product.images = [...new Set(product.images)]

  return (
    <ProductDetailPage
      params={params}
      initialProduct={product}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Certificats de mariage', href: '/accessoires-personnalises/certificats-mariage' },
      ]}
    />
  )
}
