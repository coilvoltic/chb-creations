import ProductDetailPage from '@/components/ProductDetailPage'

export default function TextileProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Textile', href: '/accessoires-personnalises/textile' },
      ]}
    />
  )
}
