import ProductListingPage from '@/components/ProductListingPage'
import { getFairePartsProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Faire-parts',
  description: 'Faire-parts élégants pour mariages et événements à Marseille. Créations personnalisées.',
  path: '/accessoires-personnalises/faire-parts',
  image: '/imgs/accessoires-personnalises/fairePartsMain.png',
})

export const revalidate = 3600

export default async function FairePartsPage() {
  const fairePartsData = await getFairePartsProducts()

  return (
    <ProductListingPage
      products={fairePartsData}
      title="Faire-parts."
      description='Toute la gamme "Faire-parts".'
      heroImage="/imgs/accessoires-personnalises/fairePartsMain.png"
      heroAlt="Faire-parts"
      categorySlug="faire-parts"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Faire-parts', href: '/accessoires-personnalises/faire-parts' }
      ]}
    />
  )
}
