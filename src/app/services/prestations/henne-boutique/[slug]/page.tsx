import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneBoutiqueProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/services/prestations' },
        { label: 'Henné en Boutique', href: '/services/prestations/henne-boutique' },
      ]}
    />
  )
}
