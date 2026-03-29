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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'name' | 'category' | 'subcategory' | 'price' | 'stock'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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

  // Handle sorting
  const handleSort = (field: 'name' | 'category' | 'subcategory' | 'price' | 'stock') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'fr')
          break
        case 'category':
          comparison = a.category.localeCompare(b.category, 'fr')
          break
        case 'subcategory':
          comparison = a.subcategory.localeCompare(b.subcategory, 'fr')
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'stock':
          comparison = a.stock - b.stock
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Gestion des Produits</h1>
              <p className="text-sm text-stone-600">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                {searchQuery && ` (${products.length} au total)`}
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => router.push('/admin/products/reorder')}
                className="px-3 py-2 md:px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors text-sm md:text-base"
              >
                <span className="hidden sm:inline">Réorganiser</span>
                <span className="sm:hidden">Ordre</span>
              </button>
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

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un produit par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                title="Effacer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <p className="text-stone-600 mb-4">
              {searchQuery ? `Aucun produit trouvé pour "${searchQuery}"` : 'Aucun produit trouvé'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/admin/products/new')}
                className="px-4 py-2 bg-black hover:bg-stone-800 text-white rounded-lg transition-colors"
              >
                Créer le premier produit
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 font-medium text-sm text-stone-700">
              <div className="col-span-1">Image</div>
              <button
                onClick={() => handleSort('name')}
                className="col-span-3 flex items-center gap-1 hover:text-black transition-colors text-left"
              >
                Nom
                {sortField === 'name' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSort('category')}
                className="col-span-2 flex items-center gap-1 hover:text-black transition-colors text-left"
              >
                Catégorie
                {sortField === 'category' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSort('subcategory')}
                className="col-span-2 flex items-center gap-1 hover:text-black transition-colors text-left"
              >
                Sous-catégorie
                {sortField === 'subcategory' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSort('price')}
                className="col-span-1 flex items-center gap-1 hover:text-black transition-colors text-left"
              >
                Prix
                {sortField === 'price' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <button
                onClick={() => handleSort('stock')}
                className="col-span-1 flex items-center gap-1 hover:text-black transition-colors text-left"
              >
                Stock
                {sortField === 'stock' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {sortDirection === 'asc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                )}
              </button>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Product List */}
            <div className="divide-y divide-stone-200">
              {filteredProducts.map((product) => (
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
                        onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                        className="flex-1 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Modifier"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="flex-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
                      <p className={`font-medium ${product.new_price ? "text-red-600" : "text-black"}`}>
                        {(product.new_price ?? product.price).toFixed(2)} €
                      </p>

                      {product.new_price && (
                        <p className="text-sm text-black line-through">
                          {product.price.toFixed(2)} €
                        </p>
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
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Modifier"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
