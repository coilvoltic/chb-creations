import ProductDetailPage from '@/components/ProductDetailPage'

export default function PackHenneProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Henné', href: '/services/henne' },
        { label: 'Pack henné', href: '/services/henne/pack-henne' },
      ]}
    />
  )
}
