export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-5">
      <div className="max-w-lg text-center">
        <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-stone-900 mb-4 tracking-wide">
          CHB CRÉATIONS
        </h1>

        <h2 className="font-cinzel text-xl md:text-2xl font-semibold text-stone-800 mb-4">
          Site en maintenance
        </h2>

        <p className="text-stone-600 mb-8 leading-relaxed">
          Le site est actuellement en maintenance. Nous revenons très bientôt !
        </p>

        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider mb-4">
            Nous contacter
          </h3>

          <div className="space-y-3">
            <a
              href="mailto:chbcreations13@gmail.com"
              className="block text-stone-800 font-medium hover:text-stone-600 transition-colors"
            >
              chbcreations13@gmail.com
            </a>

            <a
              href="tel:+33768662910"
              className="block text-stone-800 font-medium hover:text-stone-600 transition-colors"
            >
              07 68 66 29 10
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
