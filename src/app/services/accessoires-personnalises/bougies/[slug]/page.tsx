import ProductDetailPage from '@/components/ProductDetailPage'

export default function BougiesProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/services/accessoires-personnalises' },
        { label: 'Bougies', href: '/services/accessoires-personnalises/bougies' },
      ]}
    />
  )
}
