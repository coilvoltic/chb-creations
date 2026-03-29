import ProductDetailPage from '@/components/ProductDetailPage'
import { generateProductMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return generateProductMetadata(slug, 'henne-domicile', '/prestations/henne-domicile', '/imgs/prestations/henneDomicileMain.png')
}

export default function HenneDomicileProductPage({ params }: Props) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné à Domicile', href: '/prestations/henne-domicile' },
      ]}
    />
  )
}
