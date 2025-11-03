'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useState } from 'react'

export default function ConnexionPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: Implémenter la logique d'authentification
    console.log('Tentative de connexion:', { email, password })

    // Simuler un délai
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
                Connexion
              </h1>
              <p className="text-gray-600">
                Accédez à votre espace personnel
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-3xl shadow-soft p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="votre@email.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                      Se souvenir de moi
                    </label>
                  </div>
                  <Link href="/mot-de-passe-oublie" className="text-sm text-black hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continuer avec Facebook
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Vous n&apos;avez pas de compte ?{' '}
                  <Link href="/inscription" className="text-black font-semibold hover:underline">
                    S&apos;inscrire
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
