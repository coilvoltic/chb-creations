import ProductDetailPage from '@/components/ProductDetailPage'

export default function BendirProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Bendir', href: '/services/accessoires/bendir' },
      ]}
    />
  )
}
