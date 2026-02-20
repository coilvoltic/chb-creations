import ProductListingPage from '@/components/ProductListingPage'
import { getArtDeTableProducts } from '@/actions/products'

export const revalidate = 3600

export default async function ArtDeTablePage() {
  const artDeTableData = await getArtDeTableProducts()

  return (
    <ProductListingPage
      products={artDeTableData}
      title="Art de table."
      description='Tout la gamme "Art de table".'
      heroImage="/imgs/locations/artDeTableMain.png"
      heroAlt="Art de table"
      categorySlug="art-de-table"
      breadcrumbItems={[
        { label: 'Locations', href: '/locations' },
        { label: 'Art de table', href: '/locations/art-de-table' }
      ]}
    />
  )
}
