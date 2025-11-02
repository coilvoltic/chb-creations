import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function AccessoiresPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-stone-100 py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Accessoires Personnalisés
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              Créations uniques et sur mesure : bijoux, sacs et objets décoratifs qui reflètent votre style personnel.
              Chaque pièce est conçue avec soin pour créer des accessoires qui vous ressemblent.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black">Nos créations</h2>
                <ul className="space-y-3 text-stone-700">
                  <li>• Bijoux personnalisés</li>
                  <li>• Sacs brodés et décorés</li>
                  <li>• Objets décoratifs sur mesure</li>
                  <li>• Accessoires pour événements</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black">Notre approche</h2>
                <p className="text-stone-700 leading-relaxed">
                  Nous travaillons en étroite collaboration avec vous pour créer des accessoires qui correspondent
                  exactement à vos envies et à votre personnalité. Chaque création est unique.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/contact"
                className="inline-block bg-black text-white px-8 py-4 hover:bg-stone-800 transition-colors text-lg font-medium"
              >
                Discutons de votre projet
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
