import ProductListingPage from '@/components/ProductListingPage'
import { getBougiesProducts } from '@/actions/products'

export default async function BougiesPage() {
  const bougiesData = await getBougiesProducts()

  return (
    <ProductListingPage
      products={bougiesData}
      title="Bougies."
      description='Toute la gamme "Bougies".'
      heroImage="/imgs/accessoires/bougiesMain.png"
      heroAlt="Bougies"
      categorySlug="bougies"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Bougies', href: '/services/accessoires/bougies' }
      ]}
    />
  )
}
