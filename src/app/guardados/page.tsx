'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bookmark, ArrowLeft, Trash2 } from 'lucide-react'

export default function GuardadosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return router.push('/auth/login')
      
      setUser(currentUser)

      // Traer la tabla de favoritos unida a los productos
      const { data } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products ( *, product_images(image_url, is_primary) )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (data) setFavorites(data)
      setIsLoading(false)
    }
    fetchFavorites()
  }, [router, supabase])

  const removeFavorite = async (favoriteId: string) => {
    await supabase.from('favorites').delete().eq('id', favoriteId)
    setFavorites(favorites.filter(fav => fav.id !== favoriteId))
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando tus guardados...</div>

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-600 hover:text-red-800 flex items-center gap-2 font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" /> Volver a MecaStore
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Bookmark className="w-6 h-6 text-red-700" /> Mis Productos Guardados
        </h1>

        {favorites.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500 font-medium">Aún no has guardado ningún producto para comprar después.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const product = fav.products
              if (!product) return null
              const img = product.product_images?.find((i:any) => i.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.png'

              return (
                <div key={fav.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="h-40 w-full bg-gray-100 relative">
                    <img src={img} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.title}</h3>
                    <p className="text-lg font-black text-gray-900 mb-4">S/ {product.price.toFixed(2)}</p>
                    
                    <div className="mt-auto flex gap-2">
                      <Link href={`/producto/${product.id}`} className="flex-1 bg-red-50 hover:bg-red-100 text-red-800 text-center text-xs font-bold py-2 rounded transition-colors">
                        Ver Detalles
                      </Link>
                      <button onClick={() => removeFavorite(fav.id)} className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 px-3 py-2 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}