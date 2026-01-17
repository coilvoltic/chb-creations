import ProductListingPage from '@/components/ProductListingPage'
import { getTextileProducts } from '@/actions/products'
export const revalidate = 60

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
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Textile', href: '/services/accessoires-personnalises/textile' }
      ]}
    />
  )
}
