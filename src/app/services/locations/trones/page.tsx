import ProductListingPage from '@/components/ProductListingPage'
import { getTronesProducts } from '@/actions/products'
export const dynamic = 'force-dynamic'

export default async function TronesPage() {
  const tronesData = await getTronesProducts()

  return (
    <ProductListingPage
      products={tronesData}
      title="Trônes."
      description='Toute la gamme "Trônes".'
      heroImage="/imgs/locations/tronesMain.jpeg"
      heroAlt="Trônes"
      categorySlug="trones"
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Trônes', href: '/services/locations/trones' }
      ]}
    />
  )
}
