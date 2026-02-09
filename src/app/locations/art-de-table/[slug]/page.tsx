import ProductDetailPage from '@/components/ProductDetailPage'

export default function ArtDeTableProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/locations' },
        { label: 'Art de table', href: '/locations/art-de-table' },
      ]}
    />
  )
}
