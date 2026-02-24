import { buildStaticMetadata } from '@/lib/seo'

export const metadata = buildStaticMetadata({
  title: 'Contact',
  description: 'Contactez CHB Créations à Marseille. Questions, devis et informations pour locations, accessoires personnalisés ou henné.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
