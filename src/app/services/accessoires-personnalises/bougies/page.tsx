import ProductListingPage from '@/components/ProductListingPage'
import { getBougiesProducts } from '@/actions/products'

export const revalidate = 60

export default async function BougiesPage() {
  const bougiesData = await getBougiesProducts()

  return (
    <ProductListingPage
      products={bougiesData}
      title="Bougies."
      description='Toute la gamme "Bougies".'
      heroImage="/imgs/accessoires-personnalises/bougiesMain.png"
      heroAlt="Bougies"
      categorySlug="bougies"
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/services/accessoires-personnalises' },
        { label: 'Bougies', href: '/services/accessoires-personnalises/bougies' }
      ]}
    />
  )
}
