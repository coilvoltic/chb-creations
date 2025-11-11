export default function Footer() {
  return (
    <footer className="bg-stone-100 text-stone-700 border-t border-stone-200">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-stone-900 text-xl font-bold mb-4 font-satisfy">CHB Créations</h3>
            <p className="text-sm leading-relaxed text-stone-600">
              Votre partenaire de confiance pour la location et la personnalisation à Marseille.
            </p>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-stone-900 text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-stone-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>100 Boulevard de Saint-Loup<br />13010 Marseille, France</span>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-stone-600 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <div>+33 6 67 94 26 90 - Chaymae</div>
                  <div>+33 9 83 72 755 - Boutique</div>
                </div>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-stone-600 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a href="mailto:chaymaeb.creations@gmail.com" className="hover:text-stone-900 transition-colors">
                  chaymaeb.creations@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-stone-900 text-lg font-semibold mb-4">Horaires</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-stone-600 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Lundi au Vendredi : 14h00 - 18h00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-300 mt-8 pt-8 text-center text-sm text-stone-600">
          <p>&copy; {new Date().getFullYear()} CHB Créations. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
