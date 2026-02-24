import ProductListingPage from '@/components/ProductListingPage'
import { getDecoEtAccessoiresProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Déco & Accessoires - Location',
  description: 'Location de décoration et accessoires pour vos événements à Marseille. Sublimez vos cérémonies.',
  path: '/locations/deco-et-accessoires',
})

export const revalidate = 3600

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
