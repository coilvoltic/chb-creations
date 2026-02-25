import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'art-de-table', '/locations/art-de-table', '/imgs/locations/artDeTableMain.png')
}

export default function ArtDeTableProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/locations' },
        { label: 'Art de table', href: '/locations/art-de-table' },
      ]}
    />
  )
}
