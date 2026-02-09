import ProductDetailPage from '@/components/ProductDetailPage'

export default function HenneBoutiqueProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné en Boutique', href: '/prestations/henne-boutique' },
      ]}
    />
  )
}
