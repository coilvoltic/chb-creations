import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function HennePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-stone-100 py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Prestations Henné
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              Art du henné traditionnel et contemporain pour mariages, événements et occasions spéciales.
              Des motifs délicats et raffinés pour sublimer vos mains et vos pieds.
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
                <h2 className="text-2xl font-bold text-black">Nos prestations</h2>
                <ul className="space-y-3 text-stone-700">
                  <li>• Henné pour mariages</li>
                  <li>• Événements privés et familiaux</li>
                  <li>• Motifs traditionnels</li>
                  <li>• Créations contemporaines</li>
                  <li>• Sur-mesure selon vos envies</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black">Notre expertise</h2>
                <p className="text-stone-700 leading-relaxed">
                  Avec une technique maîtrisée et un sens artistique développé, nous créons des motifs de henné
                  qui allient tradition et modernité. Chaque création est unique et réalisée avec des produits naturels
                  de qualité.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/contact"
                className="inline-block bg-black text-white px-8 py-4 hover:bg-stone-800 transition-colors text-lg font-medium"
              >
                Réserver une séance
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
