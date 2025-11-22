import ProductDetailPage from '@/components/ProductDetailPage'

export default function CertificatsMariageProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/services/accessoires' },
        { label: 'Certificats de mariage', href: '/services/accessoires/certificats-mariage' },
      ]}
    />
  )
}
