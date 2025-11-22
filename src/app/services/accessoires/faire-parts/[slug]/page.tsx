import ProductDetailPage from '@/components/ProductDetailPage'

export default function FairePartsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Faire-parts', href: '/services/accessoires/faire-parts' },
      ]}
    />
  )
}
