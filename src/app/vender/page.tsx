'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { 
  Camera, Upload, Info, ChevronDown, 
  Cpu, CircuitBoard, Settings, Printer, Wrench, 
  Plug, BatteryCharging, GraduationCap, Code, 
  Package, Tag, MoreHorizontal, X, ArrowLeft 
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface Category { 
  id: string
  name: string 
}

export default function VenderPage() {
  const router = useRouter()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false) // NUEVO: Estado de compresión
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  
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
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.whatsapp) {
        toast.error('Debes completar tu perfil y WhatsApp antes de publicar')
        return router.push('/completar-perfil')
      }

      const { data: cats } = await supabase.from('categories').select('*').order('name')
      if (cats) setCategories(cats)
    }
    loadInitialData()
  }, [router, supabase])

  // --- VALIDACIÓN Y COMPRESIÓN DE FOTOS ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // 1. Validar peso original (Máximo 5MB para evitar colgar el navegador)
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`La imagen "${file.name}" supera los 5MB permitidos.`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      setIsCompressing(true)
      const toastId = toast.loading('Procesando imágenes...')

      try {
        // 2. Opciones de compresión (Máximo 300KB y resolución HD)
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        }

        // Comprimir todas las imágenes en paralelo
        const compressedPromises = validFiles.map(async (file) => {
          const compressedBlob = await imageCompression(file, options)
          // Convertir el Blob de nuevo a File
          return new File([compressedBlob], file.name, { type: compressedBlob.type })
        })

        const compressedFiles = await Promise.all(compressedPromises)

        // 3. Guardar las imágenes comprimidas
        setFiles(prevFiles => {
          const combinedFiles = [...prevFiles, ...compressedFiles].slice(0, 5) // Máximo 5 fotos
          setPreviewUrls(combinedFiles.map(file => URL.createObjectURL(file)))
          return combinedFiles
        })

        toast.success('Imágenes listas', { id: toastId })
      } catch (error) {
        toast.error('Error al procesar las imágenes', { id: toastId })
        console.error(error)
      } finally {
        setIsCompressing(false)
      }
    }
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== indexToRemove)
      setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)))
      return newFiles
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^0-9.]/g, '')
    const parts = rawValue.split('.')
    if (parts.length > 2) rawValue = parts[0] + '.' + parts.slice(1).join('')
    
    if (parts[0]) {
      let intValue = parseInt(parts[0], 10)
      if (intValue > 9999) intValue = 9999
      parts[0] = intValue.toLocaleString('en-US')
    }
    
    setFormData({ ...formData, price: parts.join('.') })
  }

  const getCategoryIcon = (name: string, className = "w-5 h-5 text-gray-500") => {
    const lower = name.toLowerCase()
    if (lower.includes('electrónic')) return <Cpu className={className} />
    if (lower.includes('microcontrolador') || lower.includes('arduino')) return <CircuitBoard className={className} />
    if (lower.includes('motor') || lower.includes('actuador')) return <Settings className={className} />
    if (lower.includes('impresión 3d')) return <Printer className={className} />
    if (lower.includes('herramienta')) return <Wrench className={className} />
    if (lower.includes('cable')) return <Plug className={className} />
    if (lower.includes('fuente')) return <BatteryCharging className={className} />
    if (lower.includes('proyecto')) return <GraduationCap className={className} />
    if (lower.includes('software')) return <Code className={className} />
    if (lower.includes('material')) return <Package className={className} />
    if (lower.includes('otro')) return <MoreHorizontal className={className} />
    return <Tag className={className} />
  }

  const selectedCategoryObj = categories.find(c => c.id === formData.categoryId)
  const isOtrosSelected = selectedCategoryObj?.name?.toLowerCase().includes('otros')

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.title.trim().length === 0) return toast.error('El título no puede estar vacío')
    if (formData.description.trim().length === 0) return toast.error('La descripción no puede estar vacía')
    if (!userId || files.length === 0) return toast.error('Debes subir al menos una fotografía')
    if (!formData.categoryId) return toast.error('Debes seleccionar una categoría')
    
    if (isOtrosSelected && !formData.customCategory.trim()) {
      return toast.error('Por favor especifica el nombre de la categoría personalizada')
    }

    setIsLoading(true)

    try {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId)
        .eq('status', 'active')

      if (count !== null && count >= 15) {
        toast.error('Límite alcanzado: Tienes demasiadas publicaciones activas. Elimina algunas para continuar.')
        setIsLoading(false)
        return
      }

      const numericPrice = parseFloat(formData.price.replace(/,/g, ''))

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: numericPrice,
          condition: formData.condition,
          category_id: formData.categoryId,
          custom_category: isOtrosSelected ? formData.customCategory.trim() : null
        }).select().single()

      if (productError) throw productError

      // Las fotos subidas ahora pesarán 10 veces menos gracias a la compresión
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
    <div className="min-h-screen bg-gradient-to-br from-[#fdf4f4] via-white to-red-50/50 py-10 px-4 font-sans flex flex-col">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto w-full mb-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-red-50 transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al catálogo
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(185,28,28,0.06)] p-6 sm:p-10 border border-red-100 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-700 to-red-900"></div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Publicar Producto</h1>
          <p className="text-sm font-medium text-gray-500">Ingresa los detalles de tu componente para empezar a vender en MecaStore.</p>
        </div>
        
        <form onSubmit={handlePublish} className="space-y-6">
          {/* FOTOS */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">Fotografías (Máx. 5, max 5MB c/u) *</label>
            
            <div className="flex gap-3">
              <label className={`flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-2xl transition-colors group ${isCompressing ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-red-200 cursor-pointer bg-red-50/30 hover:bg-red-50'}`}>
                <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Camera className={`w-5 h-5 ${isCompressing ? 'text-gray-400' : 'text-red-600'}`} />
                </div>
                <span className={`text-sm font-bold ${isCompressing ? 'text-gray-400' : 'text-gray-700'}`}>Tomar Foto</span>
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} disabled={isCompressing} />
              </label>

              <label className={`flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-2xl transition-colors group ${isCompressing ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-red-200 cursor-pointer bg-red-50/30 hover:bg-red-50'}`}>
                <div className="bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <Upload className={`w-5 h-5 ${isCompressing ? 'text-gray-400' : 'text-red-600'}`} />
                </div>
                <span className={`text-sm font-bold ${isCompressing ? 'text-gray-400' : 'text-gray-700'}`}>De Galería</span>
                <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} disabled={isCompressing} />
              </label>
            </div>

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-red-100 shadow-sm group">
                    <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={isCompressing || isLoading}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Nombre del producto *</label>
              <input 
                name="title" 
                required 
                maxLength={60}
                value={formData.title}
                onChange={handleChange} 
                placeholder="Nombre del componente o repuesto (Máx. 60 caracteres)"
                className="w-full px-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Precio (S/) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-red-500 font-black text-lg">S/</span>
                </div>
                <input 
                  name="price" 
                  type="text" 
                  required 
                  value={formData.price}
                  onChange={handlePriceChange} 
                  placeholder="0.00 (Máx. 9999)"
                  className="w-full pl-11 pr-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Condición *</label>
              <div className="relative">
                <select 
                  name="condition" 
                  required 
                  value={formData.condition}
                  onChange={handleChange} 
                  className="w-full pl-4 pr-10 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-bold text-gray-900 transition-all appearance-none cursor-pointer"
                >
                  <option value="Nuevo"> Nuevo</option>
                  <option value="Seminuevo"> Seminuevo</option>
                  <option value="Para repuesto"> Para repuesto</option>
                  <option value="Diseño propio"> Diseño propio</option>
                  <option value="Prototipo"> Prototipo</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2 relative" ref={dropdownRef}>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Categoría *</label>
              <div 
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={`w-full px-4 py-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition-all bg-red-50/30 ${isCategoryOpen ? 'border-red-600 ring-2 ring-red-600/20' : 'border-red-200 hover:border-red-400'}`}
              >
                {formData.categoryId ? (
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(selectedCategoryObj?.name || '')}
                    <span className="font-medium text-gray-900">{selectedCategoryObj?.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Selecciona una categoría...</span>
                  </div>
                )}
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </div>

              {isCategoryOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-red-100 rounded-xl shadow-xl max-h-64 overflow-y-auto py-2 hide-scrollbar">
                  {categories.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setFormData({ ...formData, categoryId: c.id })
                        setIsCategoryOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      {getCategoryIcon(c.name)}
                      <span className="font-medium text-gray-700">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOtrosSelected && (
              <div className="md:col-span-2 bg-gradient-to-br from-red-50 to-red-100/50 p-5 rounded-2xl border border-red-200 shadow-inner">
                <label className="flex items-center gap-2 text-sm font-bold text-red-900 mb-2">
                  <Info className="w-4 h-4" />
                  Especifica la Categoría o Especialidad *
                </label>
                <input 
                  name="customCategory" 
                  required={isOtrosSelected} 
                  maxLength={40}
                  value={formData.customCategory}
                  onChange={handleChange} 
                  placeholder="Ej. Neumática, PLC, Sensores especiales..."
                  className="w-full px-4 py-3 border border-red-300 rounded-xl outline-none focus:border-red-700 focus:ring-2 focus:ring-red-700/20 bg-white font-medium text-gray-900 transition-all" 
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Descripción *</label>
              <textarea 
                name="description" 
                rows={5} 
                required 
                maxLength={1000}
                value={formData.description}
                onChange={handleChange} 
                placeholder="Describe los detalles técnicos del producto, estado de conservación, accesorios incluidos... (Máx. 1000 caracteres)"
                className="w-full px-4 py-3.5 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900 transition-all placeholder:text-gray-400 resize-none" 
              />
            </div>
          </div>

          <button 
            disabled={isLoading || isCompressing} 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-black py-4 px-4 rounded-xl transition-all mt-4 disabled:opacity-70 flex justify-center items-center gap-2 shadow-[0_4px_14px_0_rgb(185,28,28,0.39)] hover:shadow-[0_6px_20px_rgba(185,28,28,0.23)] hover:-translate-y-0.5"
          >
            <Upload className="w-5 h-5" /> {isLoading ? 'Subiendo producto...' : isCompressing ? 'Procesando imágenes...' : 'Publicar Producto'}
          </button>
        </form>
      </div>
    </div>
  )
}