import ProductDetailPage from '@/components/ProductDetailPage'

export default function BougiesProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Bougies', href: '/services/accessoires/bougies' },
      ]}
    />
  )
}
