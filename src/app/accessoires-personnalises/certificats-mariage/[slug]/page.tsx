import ProductDetailPage from '@/components/ProductDetailPage'

export default function CertificatsMariageProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <ProductDetailPage
      params={params}
      breadcrumbItems={[
        { label: 'Accessoires', href: '/accessoires' },
        { label: 'Certificats de mariage', href: '/accessoires-personnalises/certificats-mariage' },
      ]}
    />
  )
}
