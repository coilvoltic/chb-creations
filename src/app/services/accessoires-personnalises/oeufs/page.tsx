import ProductListingPage from '@/components/ProductListingPage'
import { getOeufsProducts } from '@/actions/products'
export const dynamic = 'force-dynamic'

export default async function OeufsPage() {
  const oeufsData = await getOeufsProducts()

  return (
    <ProductListingPage
      products={oeufsData}
      title="Œufs."
      description='Toute la gamme "Œufs".'
      heroImage="/imgs/accessoires-personnalises/oeufsMain.jpeg"
      heroAlt="Œufs"
      categorySlug="oeufs"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Œufs', href: '/services/accessoires-personnalises/oeufs' }
      ]}
    />
  )
}
