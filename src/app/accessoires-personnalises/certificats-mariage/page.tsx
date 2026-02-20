import ProductListingPage from '@/components/ProductListingPage'
import { getCertificatsMariageProducts } from '@/actions/products'
export const revalidate = 3600

export default async function CertificatsMariagePage() {
  const certificatsMariageData = await getCertificatsMariageProducts()

  return (
    <ProductListingPage
      products={certificatsMariageData}
      title="Certificats de mariage."
      description='Toute la gamme "Certificats de mariage".'
      heroImage="/imgs/accessoires-personnalises/certificatsMariageMain.png"
      heroAlt="Certificats de mariage"
      categorySlug="certificats-mariage"
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Certificats de mariage', href: '/accessoires-personnalises/certificats-mariage' }
      ]}
    />
  )
}
