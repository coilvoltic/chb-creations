import ProductDetailPage from '@/components/ProductDetailPage'

export default function CoussinsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Coussins', href: '/accessoires-personnalises/coussins' },
      ]}
    />
  )
}
