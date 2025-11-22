import ProductListingPage from '@/components/ProductListingPage'
import { getBendirProducts } from '@/actions/products'

export default async function BendirPage() {
  const bendirData = await getBendirProducts()

  return (
    <ProductListingPage
      products={bendirData}
      title="Bendir."
      description='Toute la gamme "Bendir".'
      heroImage="/imgs/accessoires/bendirMain.jpeg"
      heroAlt="Bendir"
      categorySlug="bendir"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Bendir', href: '/services/accessoires/bendir' }
      ]}
    />
  )
}
