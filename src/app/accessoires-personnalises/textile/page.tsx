import ProductListingPage from '@/components/ProductListingPage'
import { getTextileProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Textile personnalisé',
  description: 'Textiles brodés et personnalisés pour vos événements à Marseille. Créations sur mesure.',
  path: '/accessoires-personnalises/textile',
})

export const revalidate = 3600

export default async function TextilePage() {
  const textileData = await getTextileProducts()

  return (
    <ProductListingPage
      products={textileData}
      title="Textile."
      description='Toute la gamme "Textile".'
      heroImage="/imgs/accessoires-personnalises/textileMain.jpeg"
      heroAlt="Textile"
      categorySlug="textile"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Textile', href: '/accessoires-personnalises/textile' }
      ]}
    />
  )
}
