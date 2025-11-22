import ProductListingPage from '@/components/ProductListingPage'
import { getCoussinsProducts } from '@/actions/products'

export default async function CoussinsPage() {
  const coussinsData = await getCoussinsProducts()

  return (
    <ProductListingPage
      products={coussinsData}
      title="Coussins."
      description='Toute la gamme "Coussins".'
      heroImage="/imgs/accessoires/coussinMain.jpeg"
      heroAlt="Coussins"
      categorySlug="coussins"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Coussins', href: '/services/accessoires/coussins' }
      ]}
    />
  )
}
