'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Upload, DollarSign, Tag } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Category { 
  id: string
  name: string 
}

export default function VenderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'Nuevo',
    categoryId: '',
    customCategory: ''
  })

  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      setUserId(user.id)
      
      const { data: cats } = await supabase.from('categories').select('*').order('name')
      if (cats) setCategories(cats)
    }
    loadInitialData()
  }, [router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 6)
      setFiles(selectedFiles)
      setPreviewUrls(selectedFiles.map(file => URL.createObjectURL(file)))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Verificar si la categoría seleccionada es "Otros"
  const selectedCategoryObj = categories.find(c => c.id === formData.categoryId)
  const isOtrosSelected = selectedCategoryObj?.name?.toLowerCase() === 'otros'

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || files.length === 0) return toast.error('Debes subir al menos una fotografía')
    
    if (isOtrosSelected && !formData.customCategory.trim()) {
      return toast.error('Por favor especifica el nombre de la categoría personalizada')
    }

    setIsLoading(true)

    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          condition: formData.condition,
          category_id: formData.categoryId,
          custom_category: isOtrosSelected ? formData.customCategory.trim() : null
        }).select().single()

      if (productError) throw productError

      // Subida de imágenes a Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${product.id}/${Math.random()}.${file.name.split('.').pop()}`
        await supabase.storage.from('product_images').upload(fileName, file)
        const { data: urlData } = supabase.storage.from('product_images').getPublicUrl(fileName)
        await supabase.from('product_images').insert({ product_id: product.id, image_url: urlData.publicUrl, is_primary: i === 0 })
      }

      toast.success('¡Producto publicado con éxito!')
      setTimeout(() => router.push('/'), 2000)
    } catch (error: any) {
      toast.error(`Error al publicar: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf4f4] py-8 px-4 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200">
        <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Vender Producto</h1>
        
        <form onSubmit={handlePublish} className="space-y-6">
          {/* SECCIÓN DE FOTOS */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Fotografías (Máx. 6) *</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <Camera className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-500">Toca para agregar fotos</p>
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            </label>
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {previewUrls.map((url, i) => (
                  <img key={i} src={url} alt="Preview" className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NOMBRE DEL PRODUCTO */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del producto *</label>
              <input 
                name="title" 
                required 
                value={formData.title}
                onChange={handleChange} 
                placeholder="Ej. Arduino Uno R3 Original"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900" 
              />
            </div>

            {/* PRECIO */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Precio (S/) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  name="price" 
                  type="number" 
                  step="0.10" 
                  required 
                  value={formData.price}
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900" 
                />
              </div>
            </div>

            {/* CONDICIÓN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Condición *</label>
              <select 
                name="condition" 
                required 
                value={formData.condition}
                onChange={handleChange} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900"
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Seminuevo">Seminuevo</option>
                <option value="Para repuesto">Para repuesto</option>
                <option value="Diseño propio">Diseño propio</option>
                <option value="Prototipo">Prototipo</option>
              </select>
            </div>

            {/* CATEGORÍA PRINCIPAL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoría *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select 
                  name="categoryId" 
                  required 
                  value={formData.categoryId}
                  onChange={handleChange} 
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900"
                >
                  <option value="">Selecciona una categoría...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CAMPO ADICIONAL SI SELECCIONA "OTROS" */}
            {isOtrosSelected && (
              <div className="md:col-span-2 bg-red-50/60 p-4 rounded-xl border border-red-200">
                <label className="block text-sm font-bold text-red-900 mb-1">
                  Especifica la Categoría o Especialidad *
                </label>
                <input 
                  name="customCategory" 
                  required={isOtrosSelected} 
                  value={formData.customCategory}
                  onChange={handleChange} 
                  placeholder="Ej. Instrumentación Industrial, Neumática, Software, etc."
                  className="w-full px-4 py-2.5 border border-red-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900" 
                />
              </div>
            )}

            {/* DESCRIPCIÓN */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción *</label>
              <textarea 
                name="description" 
                rows={4} 
                required 
                value={formData.description}
                onChange={handleChange} 
                placeholder="Describe los detalles técnicos del producto, estado de conservación, etc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 bg-white font-medium text-gray-900" 
              />
            </div>
          </div>

          <button 
            disabled={isLoading} 
            type="submit" 
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 px-4 rounded-xl transition-colors mt-6 disabled:bg-red-400 flex justify-center items-center gap-2 shadow-md"
          >
            <Upload className="w-5 h-5" /> {isLoading ? 'Publicando...' : 'Publicar Producto'}
          </button>
        </form>
      </div>
    </div>
  )
}