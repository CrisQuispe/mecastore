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
        .select(`*, categories(name), product_images(image_url)`)
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
              <button className="w-full bg-red-700 hover:bg-red-800 text-white font-black py-4 rounded-xl shadow-lg shadow-red-700/30 transition-all flex justify-center items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5" /> Contactar al Vendedor
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}