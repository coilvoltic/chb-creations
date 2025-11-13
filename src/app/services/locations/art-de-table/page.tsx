import ProductListingPage from '@/components/ProductListingPage'
import { getArtDeTableProducts } from '@/actions/products'

export default async function ArtDeTablePage() {
  const artDeTableData = await getArtDeTableProducts()

  return (
    <ProductListingPage
      products={artDeTableData}
      title="Art de table."
      description='Tout la gamme "Art de table".'
      heroImage="/imgs/location/art-de-table/artDeTableMain.png"
      heroAlt="Art de table"
      categorySlug="art-de-table"
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Art de table', href: '/services/locations/art-de-table' }
      ]}
    />
  )
}
