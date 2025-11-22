import ProductListingPage from '@/components/ProductListingPage'
import { getDecoEtAccessoiresProducts } from '@/actions/products'

export default async function DecoAccessoiresPage() {
  const decoEtAccessoiresData = await getDecoEtAccessoiresProducts()

  return (
    <ProductListingPage
      products={decoEtAccessoiresData}
      title="Déco & Accessoires."
      description='Toute la gamme "Déco & Accessoires".'
      heroImage="/imgs/location/deco-et-accessoires/decoAccessoiresMain.png"
      heroAlt="Décoration et Accessoires"
      categorySlug="deco-et-accessoires"
      breadcrumbItems={[
        { label: 'Locations', href: '/services/locations' },
        { label: 'Déco & Accessoires', href: '/services/locations/deco-et-accessoires' }
      ]}
    />
  )
}
