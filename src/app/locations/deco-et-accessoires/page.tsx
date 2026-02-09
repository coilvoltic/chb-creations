import ProductListingPage from '@/components/ProductListingPage'
import { getDecoEtAccessoiresProducts } from '@/actions/products'
export const revalidate = 60

export default async function DecoAccessoiresPage() {
  const decoEtAccessoiresData = await getDecoEtAccessoiresProducts()

  return (
    <ProductListingPage
      products={decoEtAccessoiresData}
      title="Déco & Accessoires."
      description='Toute la gamme "Déco & Accessoires".'
      heroImage="/imgs/locations/decoAccessoiresMain.png"
      heroAlt="Décoration et Accessoires"
      categorySlug="deco-et-accessoires"
      breadcrumbItems={[
        { label: 'Locations', href: '/locations' },
        { label: 'Déco & Accessoires', href: '/locations/deco-et-accessoires' }
      ]}
    />
  )
}
