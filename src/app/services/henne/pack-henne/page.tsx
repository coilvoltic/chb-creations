import ProductListingPage from '@/components/ProductListingPage'
import { getPackHenneProducts } from '@/actions/products'
export const revalidate = 60

export default async function PackHennePage() {
  const packHenneData = await getPackHenneProducts()

  return (
    <ProductListingPage
      products={packHenneData}
      title="Pack henné."
      description='Packs complets incluant henné et prestations associées.'
      heroImage="/imgs/henne/packHenneMain.png"
      heroAlt="Pack henné"
      categorySlug="pack-henne"
      breadcrumbItems={[
        { label: 'Henné', href: '/services/henne' },
        { label: 'Pack henné', href: '/services/henne/pack-henne' }
      ]}
    />
  )
}
