import ProductDetailPage from '@/components/ProductDetailPage'

export default function TenuesHommeProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Tenues Homme', href: '/services/locations/tenues-homme' },
      ]}
    />
  )
}
