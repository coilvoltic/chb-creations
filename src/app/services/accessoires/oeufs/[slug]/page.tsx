import ProductDetailPage from '@/components/ProductDetailPage'

export default function OeufsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Œufs', href: '/services/accessoires/oeufs' },
      ]}
    />
  )
}
