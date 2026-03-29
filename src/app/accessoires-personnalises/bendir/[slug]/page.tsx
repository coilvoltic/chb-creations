import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'bendir', '/accessoires-personnalises/bendir', '/imgs/accessoires-personnalises/bendirMain.jpeg')
}

export default function BendirProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Bendir', href: '/accessoires-personnalises/bendir' },
      ]}
    />
  )
}
