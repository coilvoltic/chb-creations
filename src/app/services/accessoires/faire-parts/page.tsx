import ProductListingPage from '@/components/ProductListingPage'
import { getFairePartsProducts } from '@/actions/products'

export default async function FairePartsPage() {
  const fairePartsData = await getFairePartsProducts()

  return (
    <ProductListingPage
      products={fairePartsData}
      title="Faire-parts."
      description='Toute la gamme "Faire-parts".'
      heroImage="/imgs/accessoires/fairePartsMain.png"
      heroAlt="Faire-parts"
      categorySlug="faire-parts"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Faire-parts', href: '/services/accessoires/faire-parts' }
      ]}
    />
  )
}
