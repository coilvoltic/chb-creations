import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'henne-boutique', '/prestations/henne-boutique', '/imgs/prestations/henneBoutiqueMain.jpeg')
}

export default function HenneBoutiqueProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné en Boutique', href: '/prestations/henne-boutique' },
      ]}
    />
  )
}
