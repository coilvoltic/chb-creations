import ProductListingPage from '@/components/ProductListingPage'
import { getHenneDomicileProducts } from '@/actions/products'
export const revalidate = 60

export default async function HenneDomicilePage() {
  const henneDomicileData = await getHenneDomicileProducts()

  return (
    <ProductListingPage
      products={henneDomicileData}
      title="Henné à Domicile."
      description='Prestations de henné à votre domicile pour vos événements.'
      heroImage="/imgs/prestations/henneDomicileMain.jpeg"
      heroAlt="Henné à Domicile"
      categorySlug="henne-domicile"
      breadcrumbItems={[
        { label: 'Prestations', href: '/services/prestations' },
        { label: 'Henné à Domicile', href: '/services/prestations/henne-domicile' }
      ]}
    />
  )
}
