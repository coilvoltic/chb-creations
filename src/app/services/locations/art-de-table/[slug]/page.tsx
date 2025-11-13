import ProductDetailPage from '@/components/ProductDetailPage'

export default function ArtDeTableProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Art de table', href: '/services/locations/art-de-table' },
      ]}
    />
  )
}
