import ProductDetailPage from '@/components/ProductDetailPage'

export default function BougiesProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/accessoires-personnalises' },
        { label: 'Bougies', href: '/accessoires-personnalises/bougies' },
      ]}
    />
  )
}
