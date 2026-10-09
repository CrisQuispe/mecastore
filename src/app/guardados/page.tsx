'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2, Bookmark, Tag } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function GuardadosPage() {
  const [savedItems, setSavedItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSavedProducts()
  }, [])

  const fetchSavedProducts = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Buscamos los guardados del usuario y cruzamos los datos con la tabla de productos
      const { data } = await supabase
        .from('saved_products')
        .select(`
          id,
          product_id,
          products (
            id,
            title,
            price,
            condition,
            categories(name),
            product_images(image_url, is_primary)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        // Filtramos por si algún producto fue borrado por el vendedor pero seguía guardado
        setSavedItems(data.filter(item => item.products != null))
      }
    }
    setIsLoading(false)
  }

  const removeSavedItem = async (savedId: number, e: React.MouseEvent) => {
    e.preventDefault() // Evita que al hacer clic en borrar nos lleve a la página del producto
    
    const { error } = await supabase.from('saved_products').delete().eq('id', savedId)
    
    if (!error) {
      setSavedItems(prev => prev.filter(item => item.id !== savedId))
      toast.success('Producto eliminado de tu lista')
    } else {
      toast.error('Hubo un error al eliminar')
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf4f4] dark:bg-[#fdf4f4] font-sans text-gray-900 dark:text-gray-900 p-4 sm:p-8">
      <Toaster position="top-center" />
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-red-700 font-bold mb-6 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm">
          <ArrowLeft className="w-5 h-5" /> Volver a MecaStore
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-8 h-8 text-red-700 fill-current" />
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">Mis Productos Guardados</h1>
        </div>

        {/* CONTENIDO */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
             {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/60 rounded-lg"></div>)}
          </div>
        ) : savedItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center">
            <Bookmark className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aún no has guardado ningún producto</h3>
            <p className="text-gray-500 font-medium">Explora el catálogo y guarda los componentes que te interesen para comprarlos después.</p>
            <Link href="/" className="mt-6 bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-lg transition-colors">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedItems.map((saved) => {
              const product = saved.products
              const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
                                || product.product_images?.[0]?.image_url 
                                || '/placeholder.png'

              return (
                <Link href={`/producto/${product.id}`} key={saved.id} className="group block h-full">
                  <div className="bg-white dark:bg-white border border-gray-200 hover:border-red-700 rounded-lg overflow-hidden transition-colors flex flex-col h-full shadow-sm relative">
                    
                    {/* Botón flotante para eliminar de guardados */}
                    <button 
                      onClick={(e) => removeSavedItem(saved.id, e)}
                      className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-red-100 text-gray-400 hover:text-red-700 p-2 rounded-full shadow-sm transition-colors"
                      title="Quitar de guardados"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="h-32 md:h-40 w-full bg-gray-50 relative overflow-hidden border-b border-gray-100">
                      <img src={primaryImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-red-800 uppercase tracking-wider rounded shadow-sm">
                        {product.condition}
                      </div>
                    </div>

                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-xs md:text-sm text-gray-800 font-bold leading-tight line-clamp-2 mb-1 group-hover:text-red-800 transition-colors">
                        {product.title}
                      </h3>
                      <div className="text-base md:text-xl font-black text-gray-900 mb-2 mt-auto">
                        S/ {product.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded w-fit">
                        <Tag className="w-3 h-3" />
                        <span className="truncate">{product.categories?.name}</span>
                      </div>
                    </div>

                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}