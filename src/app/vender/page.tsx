'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Upload, DollarSign, Tag, Info, X } from 'lucide-react'
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
  
  // Archivos acumulados
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

  // --- MANEJO DE IMÁGENES ACTUALIZADO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Acumulamos las fotos nuevas con las que ya estaban, respetando el límite de 6
      setFiles(prevFiles => {
        const combinedFiles = [...prevFiles, ...newFiles].slice(0, 6)
        setPreviewUrls(combinedFiles.map(file => URL.createObjectURL(file)))
        return combinedFiles
      })
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== indexToRemove)
      setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)))
      return newFiles
    })
  }
  // ----------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Verificar si la categoría seleccionada es "Otros"
  const selectedCategoryObj = categories.find(c => c.id === formData.categoryId)
  const isOtrosSelected = selectedCategoryObj?.name?.toLowerCase().includes('otros')

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
    <div className="min-h-screen bg-gradient-to-br from-[#fdf4f4] via-white to-red-50/50 py-10 px-4 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-[0_8px_30px_rgb(185,28,28,0.06)] p-6 sm:p-10 border border-red-100 relative overflow-hidden">
        
        {/* Decoración superior roja */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-700 to-red-900"></div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Publicar Producto</h1>
          <p className="text-sm font-medium text-gray-500">Ingresa los detalles de tu componente para empezar a vender en MecaStore.</p>
        </div>
        
        <form onSubmit={handlePublish} className="space-y-6">
          
          {/* SECCIÓN DE FOTOS (Actualizada) */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Fotografías (Máx. 6) *</label>
            
            <div className="flex gap-3">
              {/* Botón 1: Tomar Foto Directa */}
              <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-red-200 border-dashed rounded-2xl cursor-pointer bg-red-50/30 hover:bg-red-50 transition-colors group">
                <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Tomar Foto</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileChange} 
                />
              </label>

              {/* Botón 2: Subir de Galería */}
              <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-red-200 border-dashed rounded-2xl cursor-pointer bg-red-50/30 hover:bg-red-50 transition-colors group">
                <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">De Galería</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>

            {/* Previsualizaciones con Botón de Eliminar */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-red-100 shadow-sm group">
                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NOMBRE DEL PRODUCTO */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Nombre del producto *</label>
              <input 
                name="title" 
                required 
                value={formData.title}
                onChange={handleChange} 
                placeholder="Nombre del componente o repuesto"
                className="w-full px-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400" 
              />
            </div>

            {/* PRECIO */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Precio (S/) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-red-500" />
                </div>
                <input 
                  name="price" 
                  type="number" 
                  step="0.10" 
                  required 
                  value={formData.price}
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full pl-11 pr-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400" 
                />
              </div>
            </div>

            {/* CONDICIÓN */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Condición *</label>
              <select 
                name="condition" 
                required 
                value={formData.condition}
                onChange={handleChange} 
                className="w-full px-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-bold text-gray-900 transition-all appearance-none cursor-pointer"
              >
                <option value="Nuevo"> Nuevo</option>
                <option value="Seminuevo"> Seminuevo</option>
                <option value="Para repuesto"> Para repuesto</option>
                <option value="Diseño propio"> Diseño propio</option>
                <option value="Prototipo"> Prototipo</option>
              </select>
            </div>

            {/* CATEGORÍA PRINCIPAL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Categoría *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-red-500" />
                </div>
                <select 
                  name="categoryId" 
                  required 
                  value={formData.categoryId}
                  onChange={handleChange} 
                  className="w-full pl-11 pr-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-400">Selecciona una categoría...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CAMPO ADICIONAL SI SELECCIONA "OTROS" */}
            {isOtrosSelected && (
              <div className="md:col-span-2 bg-gradient-to-br from-red-50 to-red-100/50 p-5 rounded-2xl border border-red-200 shadow-inner">
                <label className="flex items-center gap-2 text-sm font-bold text-red-900 mb-2">
                  <Info className="w-4 h-4" />
                  Especifica la Categoría o Especialidad *
                </label>
                <input 
                  name="customCategory" 
                  required={isOtrosSelected} 
                  value={formData.customCategory}
                  onChange={handleChange} 
                  placeholder=""
                  className="w-full px-4 py-3 border border-red-300 rounded-xl outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 bg-white font-medium text-gray-900 transition-all" 
                />
              </div>
            )}

            {/* DESCRIPCIÓN */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Descripción *</label>
              <textarea 
                name="description" 
                rows={5} 
                required 
                value={formData.description}
                onChange={handleChange} 
                placeholder="Describe los detalles técnicos del producto, estado de conservación, accesorios incluidos..."
                className="w-full px-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400 resize-none" 
              />
            </div>
          </div>

          <button 
            disabled={isLoading} 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-black py-4 px-4 rounded-xl transition-all mt-4 disabled:opacity-70 flex justify-center items-center gap-2 shadow-[0_4px_14px_0_rgb(185,28,28,0.39)] hover:shadow-[0_6px_20px_rgba(185,28,28,0.23)] hover:-translate-y-0.5"
          >
            <Upload className="w-5 h-5" /> {isLoading ? 'Subiendo producto...' : 'Publicar Producto'}
          </button>
        </form>
      </div>
    </div>
  )
}