'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [product, setProduct] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  const [activeImage, setActiveImage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase
      .from('products')
      // Si tienes tabla profiles, agrega perfiles(whatsapp)
      .select(`*, categories(name), product_images(image_url), profiles(whatsapp)`) 
      .eq('id', params.id)
      .single()

      if (data) {
        setProduct(data)
        const imgUrls = data.product_images?.map((img: any) => img.image_url) || ['/placeholder.png']
        setImages(imgUrls)
        setActiveImage(imgUrls[0])
      }
      setIsLoading(false)
    }
    fetchProduct()
  }, [params.id, supabase])

  if (isLoading) {
    return <div className="min-h-screen bg-[#fdf4f4] flex items-center justify-center font-bold">Cargando producto...</div>
  }

  if (!product) {
    return <div className="min-h-screen bg-[#fdf4f4] flex items-center justify-center font-bold">Producto no encontrado.</div>
  }

  return (
    <div className="min-h-screen bg-[#fdf4f4] dark:bg-[#fdf4f4] font-sans text-gray-900 dark:text-gray-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Botón Volver */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-bold mb-6 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm w-fit">
          <ArrowLeft className="w-5 h-5" /> Volver al catálogo
        </button>

        <div className="bg-white dark:bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          
          {/* SECCIÓN IZQUIERDA: GALERÍA TIPO ALIEXPRESS */}
          <div className="w-full md:w-3/5 p-4 sm:p-6 flex flex-col-reverse md:flex-row gap-4 bg-gray-50 border-r border-gray-100">
            
            {/* Miniaturas (Columna en PC, Fila en Celular) */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-24 shrink-0 scrollbar-hide py-1">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(img)}
                  className={`w-16 md:w-full aspect-square shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-red-700 ring-2 ring-red-700/20 opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover bg-white" />
                </button>
              ))}
            </div>

            {/* Imagen Principal */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden relative min-h-[300px] md:min-h-[500px]">
              <img src={activeImage} alt={product.title} className="w-full h-full object-contain absolute inset-0" />
            </div>
          </div>

          {/* SECCIÓN DERECHA: INFO DEL PRODUCTO */}
          <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col">
            <div className="mb-2 bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded w-fit">
              {product.condition}
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

            <div className="mt-auto space-y-4">
            {/* Botón Funcional con Número Dinámico */}
            <a 
              href={`https://wa.me/${product.profiles?.whatsapp || '51999999999'}?text=Hola,%20me%20interesa%20el%20producto%20"${encodeURIComponent(product.title)}"%20que%20vi%20en%20MecaStore.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1EBE5C] text-white font-black py-4 rounded-xl shadow-lg shadow-[#25D366]/30 transition-all flex justify-center items-center gap-3 text-lg"
            >
                {/* LOGO ORIGINAL DE WHATSAPP (SVG) */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}