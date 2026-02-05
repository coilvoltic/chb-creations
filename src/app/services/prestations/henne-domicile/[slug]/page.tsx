import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneDomicileProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/services/prestations' },
        { label: 'Henné à Domicile', href: '/services/prestations/henne-domicile' },
      ]}
    />
  )
}
