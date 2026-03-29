'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Loader from '@/components/Loader'
import { Product } from '@/types'

// Subcategories grouped by category
const SUBCATEGORIES: { label: string; value: string; category: string }[] = [
  { label: 'Art de table', value: 'art-de-table', category: 'locations' },
  { label: 'Trônes', value: 'trones', category: 'locations' },
  { label: 'Déco et accessoires', value: 'deco-et-accessoires', category: 'locations' },
  { label: 'Bendir', value: 'bendir', category: 'accessoires-personnalises' },
  { label: 'Bougies', value: 'bougies', category: 'accessoires-personnalises' },
  { label: 'Certificats mariage', value: 'certificats-mariage', category: 'accessoires-personnalises' },
  { label: 'Coussins', value: 'coussins', category: 'accessoires-personnalises' },
  { label: 'Faire-parts', value: 'faire-parts', category: 'accessoires-personnalises' },
  { label: 'Oeufs', value: 'oeufs', category: 'accessoires-personnalises' },
  { label: 'Tableaux', value: 'tableaux', category: 'accessoires-personnalises' },
  { label: 'Textile', value: 'textile', category: 'accessoires-personnalises' },
  { label: 'Henné boutique', value: 'henne-boutique', category: 'prestations' },
  { label: 'Henné domicile', value: 'henne-domicile', category: 'prestations' },
]

const CATEGORY_LABELS: Record<string, string> = {
  locations: 'Locations',
  'accessoires-personnalises': 'Accessoires personnalisés',
  prestations: 'Henné',
}

// Sortable product row
function SortableProductRow({ product }: { product: Product }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 px-4 py-3 bg-white border border-stone-200 rounded-lg ${isDragging ? 'shadow-lg z-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 touch-none"
        title="Glisser pour réorganiser"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Image */}
      {product.images && product.images.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-12 h-12 object-cover rounded-lg border border-stone-200 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-stone-400 text-xs">—</span>
        </div>
      )}

      {/* Name */}
      <p className="flex-1 font-medium text-black text-sm">{product.name}</p>

      {/* Price */}
      <p className="text-sm text-stone-500 flex-shrink-0">
        {(product.new_price ?? product.price).toFixed(2)} €
      </p>
    </div>
  )
}

export default function ReorderProductsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState(SUBCATEGORIES[0].value)
  const [products, setProducts] = useState<Product[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadProducts()
    setHasChanges(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubcategory])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/admin/login')
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const sub = SUBCATEGORIES.find((s) => s.value === selectedSubcategory)
      let query = supabase
        .from('products')
        .select('*')
        .eq('subcategory', selectedSubcategory)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })

      if (sub?.category) {
        query = query.eq('category', sub.category)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw new Error(fetchError.message)
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const items = products.map((p, index) => ({
        id: p.id,
        display_order: index + 1,
      }))

      const response = await fetch('/api/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setHasChanges(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const selectedSub = SUBCATEGORIES.find((s) => s.value === selectedSubcategory)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Réorganiser les produits</h1>
              <p className="text-sm text-stone-600">
                Glissez-déposez les produits pour définir leur ordre d&apos;affichage
              </p>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-black hover:bg-stone-800 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              )}
              {saved && !hasChanges && (
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegardé
                </span>
              )}
              <button
                onClick={() => router.push('/admin/products')}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                title="Retour"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Subcategory selector grouped by category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Sous-catégorie
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
          >
            {Object.entries(CATEGORY_LABELS).map(([catValue, catLabel]) => (
              <optgroup key={catValue} label={catLabel}>
                {SUBCATEGORIES.filter((s) => s.category === catValue).map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <p className="text-stone-500">Aucun produit dans cette sous-catégorie.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-stone-500">
                {products.length} produit{products.length > 1 ? 's' : ''} •{' '}
                <span className="font-medium text-stone-700">{selectedSub?.label}</span>
              </p>
              {hasChanges && (
                <p className="text-sm text-amber-600 font-medium">Modifications non sauvegardées</p>
              )}
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {products.map((product) => (
                    <SortableProductRow key={product.id} product={product} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {hasChanges && (
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-black hover:bg-stone-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde en cours...' : 'Sauvegarder l\'ordre'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
