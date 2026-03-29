import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'bougies', '/accessoires-personnalises/bougies', '/imgs/accessoires-personnalises/bougiesMain.png')
}

export default function BougiesProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/accessoires-personnalises' },
        { label: 'Bougies', href: '/accessoires-personnalises/bougies' },
      ]}
    />
  )
}
