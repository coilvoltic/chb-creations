import ProductListingPage from '@/components/ProductListingPage'
import { getBendirProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Bendir personnalisé',
  description: 'Bendirs décorés et personnalisés pour vos événements à Marseille. Art traditionnel revisité.',
  path: '/accessoires-personnalises/bendir',
  image: '/imgs/accessoires-personnalises/bendirMain.jpeg',
})

export const revalidate = 3600

export default async function BendirPage() {
  const bendirData = await getBendirProducts()

  return (
    <ProductListingPage
      products={bendirData}
      title="Bendir."
      description='Toute la gamme "Bendir".'
      heroImage="/imgs/accessoires-personnalises/bendirMain.jpeg"
      heroAlt="Bendir"
      categorySlug="bendir"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Bendir', href: '/accessoires-personnalises/bendir' }
      ]}
    />
  )
}
