import ProductDetailPage from '@/components/ProductDetailPage'

export default function TableauxProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Tableaux', href: '/services/accessoires/tableaux' },
      ]}
    />
  )
}
