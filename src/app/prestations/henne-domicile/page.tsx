import ProductListingPage from '@/components/ProductListingPage'
import { getHenneDomicileProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Henné à Domicile',
  description: 'Prestations de henné à votre domicile pour vos événements à Marseille. Service personnalisé.',
  path: '/prestations/henne-domicile',
  image: '/imgs/prestations/henneDomicileMain.png',
})

export const revalidate = 3600

export default async function HenneDomicilePage() {
  const henneDomicileData = await getHenneDomicileProducts()

  return (
    <ProductListingPage
      products={henneDomicileData}
      title="Henné à Domicile."
      description='Prestations de henné à votre domicile pour vos événements.'
      heroImage="/imgs/prestations/henneDomicileMain.png"
      heroAlt="Henné à Domicile"
      categorySlug="henne-domicile"
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné à Domicile', href: '/prestations/henne-domicile' }
      ]}
    />
  )
}
