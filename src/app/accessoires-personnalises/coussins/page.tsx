import ProductListingPage from '@/components/ProductListingPage'
import { getCoussinsProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Coussins personnalisés',
  description: 'Coussins brodés et décorés sur mesure pour vos événements à Marseille. Créations artisanales.',
  path: '/accessoires-personnalises/coussins',
  image: '/imgs/accessoires-personnalises/coussinMain.jpeg',
})

export const revalidate = 3600

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
