import ProductListingPage from '@/components/ProductListingPage'
import { getHenneBoutiqueProducts } from '@/actions/products'
import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Henné en Boutique',
  description: 'Prestations de henné en boutique avec créneaux fixes à Marseille. Art du henné traditionnel.',
  path: '/prestations/henne-boutique',
})

export const revalidate = 3600

export default async function HenneBoutiquePage() {
  const henneBoutiqueData = await getHenneBoutiqueProducts()

  return (
    <ProductListingPage
      products={henneBoutiqueData}
      title="Henné en Boutique."
      description='Prestations de henné en boutique avec créneaux fixes.'
      heroImage="/imgs/prestations/henneBoutiqueMain.jpeg"
      heroAlt="Henné en Boutique"
      categorySlug="henne-boutique"
      breadcrumbItems={[
        { label: 'Prestations', href: '/prestations' },
        { label: 'Henné en Boutique', href: '/prestations/henne-boutique' }
      ]}
    />
  )
}
