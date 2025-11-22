import ProductDetailPage from '@/components/ProductDetailPage'

export default function DecoEtAccessoiresProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Déco & Accessoires', href: '/services/locations/deco-et-accessoires' },
      ]}
    />
  )
}
