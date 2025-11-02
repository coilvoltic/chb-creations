import Navbar from '@/components/Navbar'

export default function Personnalisation() {
  const services = [
    {
      id: 1,
      title: "Accessoires Personnalisés",
      description: "Création d'accessoires uniques et personnalisés pour tous vos besoins",
      features: ["Bijoux personnalisés", "Sacs et pochettes", "Objets décoratifs sur mesure"]
    },
    {
      id: 2,
      title: "Services de Henné",
      description: "Art du henné traditionnel et contemporain pour toutes occasions",
      features: ["Henné de mariée", "Événements et fêtes", "Designs personnalisés"]
    },
    {
      id: 3,
      title: "Décoration d'Événements",
      description: "Location et mise en place de décoration pour vos événements mémorables",
      features: ["Mariages et cérémonies", "Anniversaires et fêtes", "Événements d'entreprise"]
    }
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Services de Personnalisation
            </h1>
            <p className="text-xl text-stone-600">
              Donnez vie à vos idées avec nos services de personnalisation sur mesure
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-stone-200 rounded-sm p-8 hover:border-stone-300 transition-all"
              >
                <h3 className="text-2xl font-bold text-stone-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-stone-600 mb-6">
                  {service.description}
                </p>
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-stone-700">
                      <svg
                        className="w-5 h-5 text-stone-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
                <button className="w-full bg-stone-800 text-stone-50 px-4 py-2 rounded-sm hover:bg-stone-900 transition-colors">
                  Demander un devis
                </button>
              </div>
            ))}
          </div>

          <div className="bg-stone-800 border border-stone-700 rounded-sm p-8 md:p-12 text-stone-50 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Un projet personnalisé en tête ?
            </h2>
            <p className="text-lg mb-8 text-stone-200">
              Notre équipe est là pour transformer vos idées en réalité. Contactez-nous pour discuter de votre projet.
            </p>
            <a
              href="/contact"
              className="inline-block bg-stone-50 text-stone-900 px-8 py-3 rounded-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
