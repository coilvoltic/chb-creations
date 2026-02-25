import ProductListingPage from '@/components/ProductListingPage'
import { getBougiesProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Bougies personnalisées',
  description: 'Bougies décoratives personnalisées pour vos événements à Marseille. Créations uniques et sur mesure.',
  path: '/accessoires-personnalises/bougies',
  image: '/imgs/accessoires-personnalises/bougiesMain.png',
})

export const revalidate = 3600

export default async function BougiesPage() {
  const bougiesData = await getBougiesProducts()

  return (
    <ProductListingPage
      products={bougiesData}
      title="Bougies."
      description='Toute la gamme "Bougies".'
      heroImage="/imgs/accessoires-personnalises/bougiesMain.png"
      heroAlt="Bougies"
      categorySlug="bougies"
      breadcrumbItems={[
        { label: 'Accessoires personnalisés', href: '/accessoires-personnalises' },
        { label: 'Bougies', href: '/accessoires-personnalises/bougies' }
      ]}
    />
  )
}
