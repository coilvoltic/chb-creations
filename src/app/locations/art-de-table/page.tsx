import ProductListingPage from '@/components/ProductListingPage'
import { getArtDeTableProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Art de table - Location',
  description: 'Location d\'art de table élégant pour vos événements à Marseille. Assiettes, couverts et accessoires.',
  path: '/locations/art-de-table',
})

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
