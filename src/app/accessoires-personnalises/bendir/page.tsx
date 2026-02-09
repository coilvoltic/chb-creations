import ProductListingPage from '@/components/ProductListingPage'
import { getBendirProducts } from '@/actions/products'
export const revalidate = 60

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
