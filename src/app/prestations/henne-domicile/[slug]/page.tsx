import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneDomicileProductPage({ params }: { params: Promise<{ slug: string }> }) {
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
