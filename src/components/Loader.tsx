export default function Loader() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo animé */}
        <div className="mb-8">
          <div className="relative">
            <div className="font-satisfy text-6xl text-black mb-2 animate-pulse">
              CHB
            </div>
            <div className="text-sm text-stone-600 tracking-wider uppercase font-light">
              Créations
            </div>
          </div>
        </div>

        {/* Spinner élégant */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            {/* Cercle extérieur */}
            <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
            {/* Cercle animé */}
            <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Texte de chargement */}
        <p className="mt-6 text-stone-500 text-sm animate-pulse">
          Chargement en cours...
        </p>
      </div>
    </div>
  )
}
