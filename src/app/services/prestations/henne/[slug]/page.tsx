import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneSeulProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/services/prestations' },
        { label: 'Henné', href: '/services/prestations/henne' },
      ]}
    />
  )
}
