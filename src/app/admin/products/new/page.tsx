'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Loader from '@/components/Loader'
import { ProductOptionGroup, FAQItem } from '@/lib/supabase'
import { parseSimpleMarkdown } from '@/lib/markdown'

interface ImageUpload {
  file: File
  preview: string
  uploading: boolean
  url?: string
}

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Basic fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [stock, setStock] = useState('')
  const [isOutOfStock, setIsOutOfStock] = useState(false)
  const [installationFees, setInstallationFees] = useState('')

  // Description formatting state
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Apply formatting to selected text
  const applyFormatting = (formatType: 'bold' | 'italic') => {
    const textarea = descriptionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end)

    if (!selectedText) return

    let formattedText = ''

    if (formatType === 'bold') {
      // Check for ***text*** (bold + italic)
      if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length > 6) {
        // Remove bold, keep italic: ***text*** -> *text*
        formattedText = selectedText.slice(2, -2)
      }
      // Check for **text** (bold only)
      else if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
        // Remove bold: **text** -> text
        formattedText = selectedText.slice(2, -2)
      }
      // Check for *text* (italic only)
      else if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length > 2) {
        // Add bold to italic: *text* -> ***text***
        formattedText = `**${selectedText}**`
      }
      // Plain text
      else {
        // Add bold: text -> **text**
        formattedText = `**${selectedText}**`
      }
    } else if (formatType === 'italic') {
      // Check for ***text*** (bold + italic)
      if (selectedText.startsWith('***') && selectedText.endsWith('***') && selectedText.length > 6) {
        // Remove italic, keep bold: ***text*** -> **text**
        formattedText = selectedText.slice(1, -1)
      }
      // Check for **text** (bold only)
      else if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
        // Add italic to bold: **text** -> ***text***
        formattedText = `*${selectedText}*`
      }
      // Check for *text* (italic only)
      else if (selectedText.startsWith('*') && selectedText.endsWith('*') && selectedText.length > 2) {
        // Remove italic: *text* -> text
        formattedText = selectedText.slice(1, -1)
      }
      // Plain text
      else {
        // Add italic: text -> *text*
        formattedText = `*${selectedText}*`
      }
    }

    const newDescription =
      description.substring(0, start) +
      formattedText +
      description.substring(end)

    setDescription(newDescription)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + formattedText.length)
    }, 0)
  }

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault()
        applyFormatting('bold')
      } else if (e.key === 'i') {
        e.preventDefault()
        applyFormatting('italic')
      }
    }
  }

  // Array fields
  const [images, setImages] = useState<ImageUpload[]>([])
  const [personalizations, setPersonalizations] = useState<string[]>([''])
  const [faq, setFaq] = useState<FAQItem[]>([{ question: '', answer: '' }])
  const [options, setOptions] = useState<ProductOptionGroup[]>([
    { option_type_name: '', options: [{ name: '', description: '', additional_fee: 0 }] }
  ])

  // Categories configuration (memoized to prevent infinite loop)
  const categories = useMemo(() => [
    { value: 'locations', label: 'Locations', subcategories: ['art-de-table', 'trones', 'deco-et-accessoires'] },
    { value: 'accessoires-personnalises', label: 'Accessoires Personnalisés', subcategories: ['bendir', 'bougies', 'certificats-mariage', 'coussins', 'faire-parts', 'oeufs', 'tableaux', 'textile'] },
    { value: 'prestations', label: 'Prestations', subcategories: ['henne-boutique', 'henne-domicile'] }
  ], [])

  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])

  // Update available subcategories when category changes
  useEffect(() => {
    const selectedCategory = categories.find(c => c.value === category)
    if (selectedCategory) {
      setAvailableSubcategories(selectedCategory.subcategories)
    } else {
      setAvailableSubcategories([])
    }
  }, [category, categories])

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/admin/login')
      return
    }
    setLoading(false)
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
      setSlug(generatedSlug)
    }
  }, [name])

  // Image upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ImageUpload[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    if (!subcategory) {
      throw new Error('Sous-catégorie requise pour l\'upload des images')
    }

    const uploadedUrls: string[] = []

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      if (image.url) {
        // Already uploaded
        uploadedUrls.push(image.url)
        continue
      }

      // Upload to Supabase Storage
      setImages(prev => {
        const updated = [...prev]
        updated[i].uploading = true
        return updated
      })

      // Add small delay to ensure unique timestamps between uploads
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Extract original filename without extension
      const originalName = image.file.name.substring(0, image.file.name.lastIndexOf('.'))
      const fileExt = image.file.name.split('.').pop()
      // Generate filename with timestamp and original name: timestamp_originalname.ext
      const timestamp = Date.now()
      const fileName = `${timestamp}_${originalName}.${fileExt}`
      // Upload to subcategory folder: subcategory/filename
      const filePath = `${subcategory}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chb-creations-products')
        .upload(filePath, image.file, {
          cacheControl: '315360000', // 10 years
          upsert: true // Allow overwrite in case of collision
        })

      if (uploadError) {
        throw new Error(`Erreur upload image: ${uploadError.message}`)
      }

      // Get public URL (bucket must be public)
      const { data: urlData } = supabase.storage
        .from('chb-creations-products')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Impossible de générer l\'URL de l\'image')
      }

      uploadedUrls.push(urlData.publicUrl)

      setImages(prev => {
        const updated = [...prev]
        updated[i].uploading = false
        updated[i].url = urlData.publicUrl
        return updated
      })
    }

    return uploadedUrls
  }

  // Array field handlers
  const addPersonalization = () => setPersonalizations([...personalizations, ''])
  const removePersonalization = (index: number) => setPersonalizations(personalizations.filter((_, i) => i !== index))
  const updatePersonalization = (index: number, value: string) => {
    const updated = [...personalizations]
    updated[index] = value
    setPersonalizations(updated)
  }

  const addFAQ = () => setFaq([...faq, { question: '', answer: '' }])
  const removeFAQ = (index: number) => setFaq(faq.filter((_, i) => i !== index))
  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faq]
    updated[index][field] = value
    setFaq(updated)
  }

  const addOptionGroup = () => {
    setOptions([...options, { option_type_name: '', options: [{ name: '', description: '', additional_fee: 0 }] }])
  }
  const removeOptionGroup = (index: number) => setOptions(options.filter((_, i) => i !== index))
  const updateOptionGroupName = (index: number, value: string) => {
    const updated = [...options]
    updated[index].option_type_name = value
    setOptions(updated)
  }

  const addOption = (groupIndex: number) => {
    const updated = [...options]
    updated[groupIndex].options.push({ name: '', description: '', additional_fee: 0 })
    setOptions(updated)
  }
  const removeOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...options]
    updated[groupIndex].options.splice(optionIndex, 1)
    setOptions(updated)
  }
  const updateOption = (groupIndex: number, optionIndex: number, field: 'name' | 'description' | 'additional_fee' | 'duration', value: string | number) => {
    const updated = [...options]
    updated[groupIndex].options[optionIndex][field] = value as never
    setOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validate required fields
      if (!name || !slug || !price || !category || !subcategory) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      // Validate stock only for "locations" category
      if (category === 'locations' && !stock) {
        throw new Error('Le stock est obligatoire pour les produits de location')
      }

      if (images.length === 0) {
        throw new Error('Veuillez ajouter au moins une image')
      }

      // Upload images
      const imageUrls = await uploadImages()

      // Clean up array fields (remove empty entries)
      const cleanedPersonalizations = personalizations.filter(p => p.trim() !== '')
      const cleanedFaq = faq.filter(f => f.question.trim() !== '' && f.answer.trim() !== '')
      const cleanedOptions = options
        .filter(og => og.option_type_name.trim() !== '')
        .map(og => ({
          ...og,
          options: og.options.filter(o => o.name.trim() !== '')
        }))
        .filter(og => og.options.length > 0)

      // Create product object
      const productData = {
        name,
        slug,
        price: parseFloat(price),
        new_price: newPrice ? parseFloat(newPrice) : null,
        description: description || null,
        category,
        subcategory,
        // Stock et installation_fees uniquement pour "locations", sinon valeurs par défaut
        stock: category === 'locations' ? parseInt(stock) : 0,
        is_out_of_stock: isOutOfStock,
        installation_fees: category === 'locations' && installationFees ? parseFloat(installationFees) : null,
        images: imageUrls,
        personalizations: cleanedPersonalizations.length > 0 ? cleanedPersonalizations : null,
        faq: cleanedFaq.length > 0 ? cleanedFaq : null,
        options: cleanedOptions.length > 0 ? cleanedOptions : null,
      }

      // Insert product via API
      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du produit')
      }

      await response.json()

      // Redirect to product page or dashboard
      router.push(`/admin/dashboard`)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
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
              <h1 className="text-2xl font-bold text-black mb-1 md:mb-2">Nouveau Produit</h1>
              <p className="text-sm text-stone-600">Ajouter un nouveau produit au catalogue</p>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Informations de base</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Slug (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="auto-généré depuis le nom"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Prix (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Prix promotionnel (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Optionnel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setSubcategory('')
                  }}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Sous-catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={!category}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Stock - uniquement pour la catégorie "locations" */}
              {category === 'locations' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Frais d'installation - uniquement pour la catégorie "locations" */}
              {category === 'locations' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Frais d&apos;installation (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={installationFees}
                    onChange={(e) => setInstallationFees(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Optionnel"
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isOutOfStock}
                  onChange={(e) => setIsOutOfStock(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-black focus:ring-black"
                />
                <span className="text-sm text-stone-700">Produit en rupture de stock (masqué du public)</span>
              </label>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Description
              </label>

              {/* Toolbar de formatage */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => applyFormatting('bold')}
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors text-sm font-bold"
                  title="Gras (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('italic')}
                  className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors text-sm italic"
                  title="Italique (Ctrl+I)"
                >
                  I
                </button>
                <div className="flex-1" />
                <span className="text-xs text-stone-500 self-center">
                  Sélectionnez du texte puis cliquez sur B (gras) ou I (italique)
                </span>
              </div>

              <textarea
                ref={descriptionTextareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="Décrivez votre produit ici..."
              />

              {description && (
                <div className="mt-2 p-4 bg-stone-50 border border-stone-200 rounded-lg">
                  <p className="text-xs font-medium text-stone-600 mb-2">Aperçu :</p>
                  <div
                    className="text-stone-700"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(description) }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Images <span className="text-red-500">*</span></h2>

            <div className="space-y-4">
              <div>
                <label className="block w-full px-4 py-8 border-2 border-dashed border-stone-300 rounded-lg text-center cursor-pointer hover:border-stone-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="text-stone-600">
                    <p className="font-medium">Cliquez pour ajouter des images</p>
                    <p className="text-sm text-stone-500 mt-1">ou glissez-déposez</p>
                  </div>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-stone-200"
                      />
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-sm">Upload...</div>
                        </div>
                      )}
                      {image.url && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          ✓
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Personalizations */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Champs de personnalisation</h2>
            <p className="text-sm text-stone-600 mb-4">Champs texte que le client peut remplir (ex: Prénom, Date)</p>

            <div className="space-y-3">
              {personalizations.map((field, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => updatePersonalization(index, e.target.value)}
                    placeholder="Ex: Prénom de l'enfant"
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removePersonalization(index)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Supprimer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPersonalization}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              + Ajouter un champ
            </button>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Options</h2>
            <p className="text-sm text-stone-600 mb-4">Groupes d&apos;options avec frais supplémentaires (ex: Couleur, Installation)</p>

            <div className="space-y-6">
              {options.map((optionGroup, groupIndex) => (
                <div key={groupIndex} className="border border-stone-200 rounded-lg p-4">
                  <div className="flex gap-2 mb-4 items-center">
                    <input
                      type="text"
                      value={optionGroup.option_type_name}
                      onChange={(e) => updateOptionGroupName(groupIndex, e.target.value)}
                      placeholder="Nom du groupe (ex: Couleur)"
                      className="flex-1 min-w-0 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionGroup(groupIndex)}
                      className="flex-shrink-0 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Supprimer le groupe"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 ml-0 md:ml-4">
                    {optionGroup.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex flex-col md:flex-row gap-2">
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                          placeholder="Nom option"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          value={option.description || ''}
                          onChange={(e) => updateOption(groupIndex, optionIndex, 'description', e.target.value)}
                          placeholder="Description (opt)"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                        <input
                          type="number"
                          step="1"
                          value={option.additional_fee || ''}
                          onChange={(e) => updateOption(groupIndex, optionIndex, 'additional_fee', parseInt(e.target.value) || 0)}
                          placeholder="Frais (€)"
                          className="w-full md:w-24 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                        {/* Champ durée - uniquement pour la catégorie "prestations" */}
                        {category === 'prestations' && (
                          <input
                            type="number"
                            step="1"
                            value={option.duration || ''}
                            onChange={(e) => updateOption(groupIndex, optionIndex, 'duration', parseInt(e.target.value) || 0)}
                            placeholder="Durée (min)"
                            className="w-full md:w-24 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeOption(groupIndex, optionIndex)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Supprimer l'option"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addOption(groupIndex)}
                    className="mt-3 ml-0 md:ml-4 px-4 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-lg transition-colors text-sm"
                  >
                    + Ajouter option
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOptionGroup}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              + Ajouter un groupe d&apos;options
            </button>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-black mb-6">FAQ</h2>

            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={index} className="border border-stone-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-stone-700">Question {index + 1}</label>
                    <button
                      type="button"
                      onClick={() => removeFAQ(index)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Supprimer la question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    placeholder="Question..."
                    className="w-full px-3 py-2 mb-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    placeholder="Réponse..."
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFAQ}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              + Ajouter une question
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Création en cours...' : 'Créer le produit'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
