import ProductListingPage from '@/components/ProductListingPage'
import { getTenuesHommeProducts } from '@/actions/products'

export default async function TenuesHommePage() {
  const tenuesHommeData = await getTenuesHommeProducts()

  return (
    <ProductListingPage
      products={tenuesHommeData}
      title="Tenues Homme."
      description='Toute la gamme "Tenues Homme".'
      heroImage="/imgs/locations/tenueHommeMain.png"
      heroAlt="Tenues Homme"
      categorySlug="tenues-homme"
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Tenues Homme', href: '/services/locations/tenues-homme' }
      ]}
    />
  )
}
