'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bookmark, Share2, AlertTriangle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface ProductDetailClientProps {
  product: any
  images: string[]
  initialIsSaved: boolean
  currentUser: any
}

export default function ProductDetailClient({
  product,
  images,
  initialIsSaved,
  currentUser,
}: ProductDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [activeImage, setActiveImage] = useState<string>(images[0] || '/placeholder.png')
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isSaving, setIsSaving] = useState(false)

  // FUNCIÓN PARA FORMATEAR EL NÚMERO DE WHATSAPP CON CÓDIGO DE PERÚ (+51)
  const getFormattedPhone = (phoneRaw: string | undefined | null) => {
    if (!phoneRaw) return '51999999999'
    const digits = phoneRaw.replace(/\D/g, '')
    return digits.length === 9 ? `51${digits}` : digits
  }

  // LINK DE WHATSAPP SEGURO
  const getWhatsAppLink = () => {
    const phone = getFormattedPhone(product.profiles?.whatsapp)
    const rawMessage = `Hola, me interesa el producto "${product.title}" que vi en MecaStore.`
    const encodedMessage = encodeURIComponent(rawMessage)
    return `https://wa.me/${phone}?text=${encodedMessage}`
  }

  // FUNCIÓN GUARDAR / QUITAR FAVORITO
  const toggleSave = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para guardar productos')
      router.push('/auth/login')
      return
    }

    setIsSaving(true)
    if (isSaved) {
      await supabase
        .from('saved_products')
        .delete()
        .eq('product_id', product.id)
        .eq('user_id', currentUser.id)
      setIsSaved(false)
      toast.success('Producto quitado de guardados')
    } else {
      await supabase
        .from('saved_products')
        .insert([{ product_id: product.id, user_id: currentUser.id }])
      setIsSaved(true)
      toast.success('Producto guardado exitosamente')
    }
    setIsSaving(false)
  }

  // FUNCIÓN COMPARTIR RÁPIDO
  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `¡Mira este producto en MecaStore!: ${product.title} a S/ ${product.price.toFixed(2)}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // El usuario canceló la acción
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('¡Enlace copiado al portapapeles!')
    }
  }

  // FUNCIÓN PARA REPORTAR PRODUCTO
  const handleReport = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para reportar publicaciones')
      router.push('/auth/login')
      return
    }

    const reason = window.prompt('¿Cuál es el motivo del reporte (ej. producto prohibido, estafa, precio falso, duplicado)?')
    if (!reason || !reason.trim()) return

    const { error } = await supabase.from('reports').insert({
      product_id: product.id,
      user_id: currentUser.id,
      reason: reason.trim()
    })

    if (error) {
      toast.error('Error al enviar el reporte. Inténtalo de nuevo.')
    } else {
      toast.success('Reporte enviado correctamente. El equipo lo revisará.')
    }
  }

  // CÁLCULO DE CATEGORÍA MOSTRADA
  const displayCategory = product.custom_category
    ? `Otros - ${product.custom_category}`
    : product.categories?.name || 'General'

  return (
    <div className="min-h-screen bg-[#fdf4f4] dark:bg-[#fdf4f4] font-sans text-gray-900 dark:text-gray-900 p-4 sm:p-8">
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto">
        {/* Botón Volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-bold mb-6 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm w-fit"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al catálogo
        </button>

        <div className="bg-white dark:bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          {/* GALERÍA TIPO ALIEXPRESS */}
          <div className="w-full md:w-3/5 p-4 sm:p-6 flex flex-col-reverse md:flex-row gap-4 bg-gray-50 border-r border-gray-100">
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 scrollbar-hide py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 md:w-full aspect-square shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === img
                      ? 'border-red-700 ring-2 ring-red-700/20 opacity-100'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover bg-white" />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden relative min-h-[300px] md:min-h-[500px]">
              <img src={activeImage} alt={product.title} className="w-full h-full object-contain absolute inset-0" />
            </div>
          </div>

          {/* INFORMACIÓN Y BOTONES DE ACCIÓN */}
          <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded w-fit">
                {product.condition}
              </span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
                {displayCategory}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">
              {product.title}
            </h1>

            <div className="text-4xl font-black text-red-700 mb-6">
              S/ {product.price.toFixed(2)}
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Descripción</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* BOTONERA DE ACCIÓN */}
            <div className="mt-auto space-y-3">
              {/* WhatsApp */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#1EBE5C] text-white font-black py-4 rounded-xl shadow-lg shadow-[#25D366]/30 transition-all flex justify-center items-center gap-3 text-lg"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Contactar por WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-3">
                {/* Guardar */}
                <button
                  onClick={toggleSave}
                  disabled={isSaving}
                  className={`font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 border-2 text-sm ${
                    isSaved
                      ? 'border-red-700 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Guardado' : 'Guardar'}
                </button>

                {/* Compartir Rápido */}
                <button
                  onClick={handleShare}
                  className="font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 border-2 border-gray-200 bg-white text-gray-700 hover:border-red-700 hover:text-red-700 hover:bg-red-50 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              </div>

              {/* Botón de Reporte Discreto */}
              <div className="pt-2 text-center">
                <button
                  onClick={handleReport}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-700 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reportar publicación sospechosa o duplicada
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}