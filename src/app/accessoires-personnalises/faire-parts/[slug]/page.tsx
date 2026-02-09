import ProductDetailPage from '@/components/ProductDetailPage'

export default function FairePartsProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Faire-parts', href: '/accessoires-personnalises/faire-parts' },
      ]}
    />
  )
}
