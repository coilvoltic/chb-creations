'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Loader from '@/components/Loader'
import { Product } from '@/lib/supabase'

export default function ManageProductsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndLoadProducts = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/admin/login')
      return
    }
    await loadProducts()
  }

  const loadProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setProducts(data || [])
    } catch (err) {
      console.error('Erreur chargement produits:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: number) => {
    setDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/products/delete?id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      // Recharger la liste des produits
      await loadProducts()
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Erreur suppression:', err)
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Gestion des Produits</h1>
              <p className="text-sm text-stone-600">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => router.push('/admin/products/new')}
                className="px-3 py-2 md:px-4 bg-black hover:bg-stone-800 text-white rounded-lg transition-colors text-sm md:text-base"
              >
                <span className="hidden sm:inline">+ Nouveau produit</span>
                <span className="sm:hidden">+ Produit</span>
              </button>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                title="Retour"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <p className="text-stone-600 mb-4">Aucun produit trouvé</p>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="px-4 py-2 bg-black hover:bg-stone-800 text-white rounded-lg transition-colors"
            >
              Créer le premier produit
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 font-medium text-sm text-stone-700">
              <div className="col-span-1">Image</div>
              <div className="col-span-3">Nom</div>
              <div className="col-span-2">Catégorie</div>
              <div className="col-span-2">Sous-catégorie</div>
              <div className="col-span-1">Prix</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-stone-200">
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 hover:bg-stone-50 transition-colors">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex gap-4">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-stone-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center">
                          <span className="text-stone-400 text-xs">Aucune image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-black mb-1">{product.name}</h3>
                        <p className="text-sm text-stone-600">{product.category} / {product.subcategory}</p>
                        <p className="text-sm font-medium text-black mt-1">{product.price.toFixed(2)} €</p>
                        <p className="text-sm text-stone-600">Stock: {product.stock}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg border border-stone-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center">
                          <span className="text-stone-400 text-xs">Aucune</span>
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <p className="font-medium text-black">{product.name}</p>
                      <p className="text-sm text-stone-500">ID: {product.id}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-stone-600">{product.category}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-stone-600">{product.subcategory}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="font-medium text-black">{product.price.toFixed(2)} €</p>
                      {product.new_price && (
                        <p className="text-sm text-green-600 line-through">{product.new_price.toFixed(2)} €</p>
                      )}
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm text-stone-600">{product.stock}</p>
                      {product.is_out_of_stock && (
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Rupture
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex gap-2 justify-end">
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Confirmation Modal */}
                  {deleteConfirm === product.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-black mb-2">Confirmer la suppression</h3>
                        <p className="text-stone-600 mb-6">
                          Êtes-vous sûr de vouloir supprimer le produit <strong>{product.name}</strong> ?
                          Cette action est irréversible.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
