import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneSeulProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Henné', href: '/services/henne' },
        { label: 'Henné seul', href: '/services/henne/henne-seul' },
      ]}
    />
  )
}
