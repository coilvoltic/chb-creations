import ProductListingPage from '@/components/ProductListingPage'
import { getTronesProducts } from '@/actions/products'
export const revalidate = 60

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
        { label: 'Locations', href: '/locations' },
        { label: 'Trônes', href: '/locations/trones' }
      ]}
    />
  )
}
