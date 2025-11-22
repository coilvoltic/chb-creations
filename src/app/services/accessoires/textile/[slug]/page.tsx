import ProductDetailPage from '@/components/ProductDetailPage'

export default function TextileProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Textile', href: '/services/accessoires/textile' },
      ]}
    />
  )
}
