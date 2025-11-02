import Navbar from '@/components/Navbar'

export default function Services() {
  const services = [
    {
      id: 1,
      name: "Accessoires Personnalisés",
      description: "Bijoux, sacs et objets décoratifs créés sur mesure",
      category: "Personnalisation"
    },
    {
      id: 2,
      name: "Henné Artistique",
      description: "Art du henné traditionnel et contemporain",
      category: "Beauté"
    },
    {
      id: 3,
      name: "Décoration d'Événements",
      description: "Location et mise en place pour vos occasions spéciales",
      category: "Événementiel"
    },
    {
      id: 4,
      name: "Henné de Mariée",
      description: "Designs élaborés pour votre jour spécial",
      category: "Beauté"
    },
    {
      id: 5,
      name: "Décorations Thématiques",
      description: "Ambiances personnalisées pour tous types d'événements",
      category: "Événementiel"
    },
    {
      id: 6,
      name: "Créations Sur Mesure",
      description: "Accessoires uniques adaptés à vos envies",
      category: "Personnalisation"
    }
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Nos Services
            </h1>
            <p className="text-xl text-stone-600">
              Découvrez nos créations et prestations pour embellir vos moments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-stone-200 rounded-sm overflow-hidden hover:border-stone-300 transition-all"
              >
                <div className="h-48 bg-stone-200"></div>
                <div className="p-6">
                  <div className="text-sm text-stone-700 font-semibold mb-2">
                    {product.category}
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-stone-600 mb-4">
                    {product.description}
                  </p>
                  <button className="w-full bg-black text-white px-4 py-2 rounded-none hover:bg-stone-800 transition-colors">
                    En savoir plus
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white border border-stone-200 rounded-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-stone-900 mb-4">
              Vous ne trouvez pas ce que vous cherchez ?
            </h2>
            <p className="text-stone-600 mb-6">
              Contactez-nous pour discuter de vos besoins spécifiques
            </p>
            <a
              href="/contact"
              className="inline-block bg-stone-800 text-stone-50 px-8 py-3 rounded-sm hover:bg-stone-900 transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
