import ProductListingPage from '@/components/ProductListingPage'
import { getHenneSeulProducts } from '@/actions/products'
export const revalidate = 60

export default async function HenneSeulPage() {
  const henneSeulData = await getHenneSeulProducts()

  return (
    <ProductListingPage
      products={henneSeulData}
      title="Henné seul."
      description='Prestations de henné traditionnel pour vos événements.'
      heroImage="/imgs/henne/henneSeulMain.jpeg"
      heroAlt="Henné seul"
      categorySlug="henne-seul"
      breadcrumbItems={[
        { label: 'Henné', href: '/services/henne' },
        { label: 'Henné seul', href: '/services/henne/henne-seul' }
      ]}
    />
  )
}
