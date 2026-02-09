import ProductListingPage from '@/components/ProductListingPage'
import { getCoussinsProducts } from '@/actions/products'
export const revalidate = 60

export default async function CoussinsPage() {
  const coussinsData = await getCoussinsProducts()

  return (
    <ProductListingPage
      products={coussinsData}
      title="Coussins."
      description='Toute la gamme "Coussins".'
      heroImage="/imgs/accessoires-personnalises/coussinMain.jpeg"
      heroAlt="Coussins"
      categorySlug="coussins"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Coussins', href: '/accessoires-personnalises/coussins' }
      ]}
    />
  )
}
