import ProductDetailPage from '@/components/ProductDetailPage'

export default function TronesProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Trônes', href: '/services/locations/trones' },
      ]}
    />
  )
}
