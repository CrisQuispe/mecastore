'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Trash2, CheckCircle, Package, ArrowLeft, User as UserIcon, Edit } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function PerfilPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      // 1. Obtener sesión actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return router.push('/auth/login')
      }

      // 2. Traer datos del perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) setProfile(profileData)

      // 3. Traer SOLO los productos de este usuario
      const { data: productsData } = await supabase
        .from('products')
        .select('*, product_images(image_url, is_primary)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (productsData) setProducts(productsData)
      
      setIsLoading(false)
    }

    fetchUserData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación permanentemente?')) return
    
    const { error } = await supabase.from('products').delete().eq('id', id)
    
    if (!error) {
      setProducts(products.filter(p => p.id !== id))
      toast.success('Publicación eliminada')
    } else {
      toast.error('Error al eliminar')
    }
  }

  const handleMarkAsSold = async (id: string) => {
    if (!window.confirm('¡Felicidades por tu venta! ¿Marcar este producto como vendido?')) return

    const { error } = await supabase.from('products').update({ status: 'sold' }).eq('id', id)
    
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, status: 'sold' } : p))
      toast.success('Marcado como vendido')
    } else {
      toast.error('Error al actualizar')
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando tu perfil...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      <Toaster position="top-center" />
      
      {/* Barra superior del perfil */}
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-red-800 flex items-center gap-2 font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" /> Volver a MecaStore
          </Link>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-bold flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* Tarjeta de Información Personal */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-700 flex-shrink-0">
            <UserIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.first_name} {profile?.last_name}</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono font-medium">WhatsApp: {profile?.whatsapp}</p>
          </div>
        </div>

        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Package className="w-5 h-5 text-red-700" /> Mis Publicaciones ({products.length})
        </h2>

        {/* Lista de Productos del Usuario */}
        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center text-gray-500">
            <p className="font-medium">Aún no has publicado ningún componente o proyecto.</p>
            <Link href="/vender" className="text-red-700 font-bold hover:underline mt-2 inline-block">¡Vende tu primer producto aquí!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => {
              const img = product.product_images?.find((i:any) => i.is_primary)?.image_url || product.product_images?.[0]?.image_url || '/placeholder.png'
              
              return (
                <div key={product.id} className={`bg-white p-4 rounded-lg border flex gap-4 items-center ${product.status === 'sold' ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm hover:border-red-700 transition-colors'}`}>
                  <img src={img} alt={product.title} className="w-24 h-24 object-cover rounded flex-shrink-0 border border-gray-100" />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                    <p className="text-red-700 font-black mb-3 text-lg tracking-tight">S/ {product.price.toFixed(2)}</p>
                    
                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex flex-wrap gap-2">
                      {product.status === 'active' ? (
                        <button onClick={() => handleMarkAsSold(product.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Vendido
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                          Ya vendido
                        </span>
                      )}
                      
                      {/* BOTÓN EDITAR QUE ESTABAS BUSCANDO */}
                      <Link href={`/editar/${product.id}`} className="bg-red-50 hover:bg-red-100 text-red-800 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors">
                        <Edit className="w-4 h-4" /> Editar
                      </Link>

                      <button onClick={() => handleDelete(product.id)} className="bg-white border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 text-gray-500 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors">
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