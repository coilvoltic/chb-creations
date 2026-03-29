import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'textile', '/accessoires-personnalises/textile', '/imgs/accessoires-personnalises/textileMain.jpeg')
}

export default function TextileProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Textile', href: '/accessoires-personnalises/textile' },
      ]}
    />
  )
}
