import ProductListingPage from '@/components/ProductListingPage'
import { getTableauxProducts } from '@/actions/products'

export default async function TableauxPage() {
  const tableauxData = await getTableauxProducts()

  return (
    <ProductListingPage
      products={tableauxData}
      title="Tableaux."
      description='Toute la gamme "Tableaux".'
      heroImage="/imgs/accessoires/tableauxMain.jpeg"
      heroAlt="Tableaux"
      categorySlug="tableaux"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Tableaux', href: '/services/accessoires/tableaux' }
      ]}
    />
  )
}
