import ProductListingPage from '@/components/ProductListingPage'
import { getOeufsProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Œufs décorés',
  description: 'Œufs décorés artisanaux pour vos célébrations à Marseille. Créations uniques et raffinées.',
  path: '/accessoires-personnalises/oeufs',
  image: '/imgs/accessoires-personnalises/oeufsMain.jpeg',
})

export const revalidate = 3600

export default async function OeufsPage() {
  const oeufsData = await getOeufsProducts()

  return (
    <ProductListingPage
      products={oeufsData}
      title="Œufs."
      description='Toute la gamme "Œufs".'
      heroImage="/imgs/accessoires-personnalises/oeufsMain.jpeg"
      heroAlt="Œufs"
      categorySlug="oeufs"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Œufs', href: '/accessoires-personnalises/oeufs' }
      ]}
    />
  )
}
