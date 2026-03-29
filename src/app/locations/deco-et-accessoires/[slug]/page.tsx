import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'deco-et-accessoires', '/locations/deco-et-accessoires', '/imgs/locations/decoAccessoiresMain.png')
}

export default function DecoEtAccessoiresProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/locations' },
        { label: 'Déco & Accessoires', href: '/locations/deco-et-accessoires' },
      ]}
    />
  )
}
