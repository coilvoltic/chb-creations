import ProductListingPage from '@/components/ProductListingPage'
import { getTableauxProducts } from '@/actions/products'
export const revalidate = 3600

export default async function TableauxPage() {
  const tableauxData = await getTableauxProducts()

  return (
    <ProductListingPage
      products={tableauxData}
      title="Tableaux."
      description='Toute la gamme "Tableaux".'
      heroImage="/imgs/accessoires-personnalises/tableauxMain.jpeg"
      heroAlt="Tableaux"
      categorySlug="tableaux"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Tableaux', href: '/accessoires-personnalises/tableaux' }
      ]}
    />
  )
}
