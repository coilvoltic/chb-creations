import ProductListingPage from '@/components/ProductListingPage'
import { getTronesProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Trônes - Location',
  description: 'Location de trônes majestueux pour vos événements à Marseille. Mariages, fiançailles et cérémonies.',
  path: '/locations/trones',
  image: '/imgs/locations/tronesMain.jpeg',
})

export const revalidate = 3600

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
