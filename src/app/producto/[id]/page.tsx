'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { generateWhatsAppLink } from '@/lib/whatsapp'
import { MapPin, Tag, User, GraduationCap, MessageCircle, ArrowLeft, Heart, Flag } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mainImage, setMainImage] = useState<string>('/placeholder.png')
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    const fetchProductAndUser = async () => {
      if (!params.id) return
      
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_images(image_url, is_primary), profiles(first_name, last_name, whatsapp)')
        .eq('id', params.id)
        .single()

      if (data) {
        setProduct(data)
        const primaryImg = data.product_images?.find((img: any) => img.is_primary)?.image_url || data.product_images?.[0]?.image_url || '/placeholder.png'
        setMainImage(primaryImg)

        if (user) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', params.id)
            .single()
          
          if (favData) setIsFavorite(true)
        }
      }
      setIsLoading(false)
    }
    fetchProductAndUser()
  }, [params.id, supabase])

  const handleWhatsApp = () => {
    if (product.profiles?.whatsapp) {
      const link = generateWhatsAppLink(product.profiles.whatsapp, product.title, product.price)
      window.open(link, '_blank')
    }
  }

  const toggleFavorite = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para guardar productos.')
      return router.push('/auth/login')
    }

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('product_id', product.id)
      setIsFavorite(false)
      toast.success('Eliminado de favoritos')
    } else {
      await supabase.from('favorites').insert({ user_id: currentUser.id, product_id: product.id })
      setIsFavorite(true)
      toast.success('Guardado en favoritos')
    }
  }

  const handleReport = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para reportar.')
      return router.push('/auth/login')
    }

    const reason = window.prompt('¿Por qué reportas esta publicación? (Ej: Spam, Producto falso, Ofensivo)')
    if (!reason) return

    setIsReporting(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUser.id,
      product_id: product.id,
      reason: reason
    })

    setIsReporting(false)
    if (error) {
      toast.error('Error al enviar el reporte.')
    } else {
      toast.success('Reporte enviado al administrador.')
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando detalles...</div>
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-500">Producto no encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Toaster position="top-center" />
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Volver al inicio
          </Link>
          <button onClick={handleReport} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium transition-colors">
            <Flag className="w-4 h-4" /> Reportar
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          <div className="md:w-1/2 bg-gray-100 min-h-[300px] relative">
            <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
            <button 
              onClick={toggleFavorite}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-105 transition-transform"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          <div className="md:w-1/2 p-8 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-md">{product.condition}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1"><Tag className="w-4 h-4" /> {product.categories?.name}</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            <div className="text-3xl font-bold text-blue-600 mb-6">S/ {product.price.toFixed(2)}</div>

            <div className="space-y-4 mb-8 text-gray-600 flex-grow">
              <div className="flex items-center gap-2">
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Descripción:</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Información del vendedor
              </h3>
              <p className="text-gray-700 font-medium mb-1">{product.profiles?.first_name} {product.profiles?.last_name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
              </p>
            </div>

            <button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
              <MessageCircle className="w-6 h-6" /> Contactar al vendedor
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}