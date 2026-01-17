'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Connexion avec Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error('Erreur auth:', authError)

        // Message personnalisé pour rate limit
        if (authError.message.includes('rate limit') || authError.message.includes('too many requests')) {
          setError('Trop de tentatives de connexion. Veuillez attendre 5 minutes avant de réessayer.')
        } else {
          setError(`Email ou mot de passe incorrect (${authError.message})`)
        }

        setLoading(false)
        return
      }

      // Vérifier que l'utilisateur est admin via fonction SQL
      const { data: isAdminResult, error: adminError } = await supabase
        .rpc('is_admin', { user_email: email })

      console.log('Admin check:', { isAdminResult, adminError, email })

      if (adminError || !isAdminResult) {
        // Déconnecter si pas admin
        await supabase.auth.signOut()
        setError(`Accès non autorisé. Email: ${email} non trouvé dans admin_users.`)
        setLoading(false)
        return
      }

      // Rediriger vers le dashboard
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Erreur login:', err)
      setError('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Administration</h1>
          <p className="text-stone-600 font-cinzel">CHB Créations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
