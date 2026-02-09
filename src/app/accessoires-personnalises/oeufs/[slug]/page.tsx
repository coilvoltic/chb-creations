import ProductDetailPage from '@/components/ProductDetailPage'

export default function OeufsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Œufs', href: '/accessoires-personnalises/oeufs' },
      ]}
    />
  )
}
