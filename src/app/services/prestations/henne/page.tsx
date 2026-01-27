import ProductListingPage from '@/components/ProductListingPage'
import { getHenneProducts } from '@/actions/products'
export const revalidate = 60

export default async function HenneSeulPage() {
  const henneSeulData = await getHenneProducts()

  return (
    <ProductListingPage
      products={henneSeulData}
      title="Henné."
      description='Prestations de henné traditionnel pour vos événements.'
      heroImage="/imgs/prestations/henneMain.jpeg"
      heroAlt="Henné"
      categorySlug="henne"
      breadcrumbItems={[
        { label: 'Prestations', href: '/services/prestations' },
        { label: 'Henné', href: '/services/prestations/henne' }
      ]}
    />
  )
}
