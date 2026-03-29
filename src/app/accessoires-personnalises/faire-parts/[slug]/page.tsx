import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'faire-parts', '/accessoires-personnalises/faire-parts', '/imgs/accessoires-personnalises/fairePartsMain.png')
}

export default function FairePartsProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Faire-parts', href: '/accessoires-personnalises/faire-parts' },
      ]}
    />
  )
}
