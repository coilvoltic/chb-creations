import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function DecorationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-stone-100 py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Livraison & Installation de Décoration
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed">
              Service complet de livraison et d&apos;installation de décoration pour vos événements.
              Nous créons l&apos;ambiance parfaite pour vos moments inoubliables.
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
                <h2 className="text-2xl font-bold text-black">Nos services</h2>
                <ul className="space-y-3 text-stone-700">
                  <li>• Livraison de tout le matériel</li>
                  <li>• Installation complète de la décoration</li>
                  <li>• Mise en place des tables et espaces</li>
                  <li>• Démontage après l&apos;événement</li>
                  <li>• Conseils personnalisés</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-black">Notre engagement</h2>
                <p className="text-stone-700 leading-relaxed">
                  Nous prenons en charge tous les aspects logistiques et esthétiques de votre décoration.
                  De la livraison à l&apos;installation finale, nous veillons à ce que chaque détail soit parfait
                  pour créer l&apos;ambiance de vos rêves.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/contact"
                className="inline-block bg-black text-white px-8 py-4 hover:bg-stone-800 transition-colors text-lg font-medium"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
