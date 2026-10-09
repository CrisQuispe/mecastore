'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Tag, ShoppingBag, ChevronRight, Grid, Cpu, Wrench, Code, User, LogOut, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [groupedProducts, setGroupedProducts] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      const { data } = await supabase
        .from('products')
        .select(`*, categories(name), product_images(image_url, is_primary)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (data) {
        const grouped = data.reduce((acc, product) => {
          const catName = product.categories?.name || 'Otros'
          if (!acc[catName]) acc[catName] = []
          acc[catName].push(product)
          return acc
        }, {} as Record<string, any[]>)
        setGroupedProducts(grouped)
      }
      setIsLoading(false)
    }
    fetchInitialData()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fdf4f4] dark:bg-[#fdf4f4] font-sans text-gray-900 dark:text-gray-900">
      
      {/* 1. NAVBAR DINÁMICO */}
      <nav className="bg-white dark:bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-red-800 tracking-tighter uppercase">Meca<span className="text-gray-900 dark:text-gray-900">Store</span></span>
            </Link>

            <div className="flex sm:hidden items-center gap-4">
              {user ? (
                <>
                  <Link href="/guardados" className="text-gray-600 dark:text-gray-600 hover:text-red-800"><Bookmark className="w-5 h-5" /></Link>
                  <Link href="/perfil" className="text-gray-600 dark:text-gray-600 hover:text-red-800"><User className="w-5 h-5" /></Link>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-800"><LogOut className="w-5 h-5" /></button>
                </>
              ) : (
                <Link href="/auth/login" className="text-gray-600 dark:text-gray-600 hover:text-red-800"><User className="w-5 h-5" /></Link>
              )}
            </div>
          </div>
          
          <div className="w-full max-w-xl relative group">
            <input 
              type="text" 
              placeholder="Buscar componentes..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all text-sm font-medium bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>

          <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto justify-end">
            {user ? (
              <>
                <Link href="/guardados" className="hidden sm:flex text-sm font-bold text-gray-600 dark:text-gray-600 hover:text-red-800 items-center gap-1.5"><Bookmark className="w-4 h-4" /> Guardados</Link>
                <Link href="/perfil" className="hidden sm:flex text-sm font-bold text-gray-600 dark:text-gray-600 hover:text-red-800 items-center gap-1.5"><User className="w-4 h-4" /> Mi Perfil</Link>
                <button onClick={handleLogout} className="hidden sm:flex text-sm font-bold text-red-600 hover:text-red-800 items-center gap-1.5"><LogOut className="w-4 h-4" /> Salir</button>
                <Link href="/vender" className="w-full sm:w-auto text-center justify-center bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"><ShoppingBag className="w-4 h-4" /> Vender</Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:flex text-sm font-bold text-gray-600 dark:text-gray-600 hover:text-red-800 items-center gap-1.5"><User className="w-4 h-4" /> Iniciar o Registrarse</Link>
                <Link href="/auth/login" className="w-full sm:w-auto text-center justify-center bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"><ShoppingBag className="w-4 h-4" /> Vender</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. CINTA DE OPCIONES */}
      <div className="bg-white/80 dark:bg-white/80 border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-8 text-xs font-bold text-gray-600 dark:text-gray-600 overflow-x-auto">
          <span className="flex items-center gap-1 hover:text-red-700 cursor-pointer transition-colors"><Grid className="w-3 h-3"/> Todo el catálogo</span>
          <span className="flex items-center gap-1 hover:text-red-700 cursor-pointer transition-colors"><Cpu className="w-3 h-3"/> Electrónica</span>
          <span className="flex items-center gap-1 hover:text-red-700 cursor-pointer transition-colors"><Wrench className="w-3 h-3"/> Herramientas</span>
          <span className="flex items-center gap-1 hover:text-red-700 cursor-pointer transition-colors"><Code className="w-3 h-3"/> Software</span>
        </div>
      </div>

      {/* 3. BANNER PRINCIPAL */}
      <div className="bg-gradient-to-r from-red-900 to-red-700 border-b-2 border-red-950">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight uppercase">
            Mercado de Ingeniería
          </h1>
          <p className="text-sm sm:text-base text-red-100 max-w-xl font-medium leading-tight">
            Compra y venta directa de componentes, herramientas y proyectos.
          </p>
        </div>
      </div>

      {/* 4. CONTENIDO AGRUPADO */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
             {[1,2,3,4].map(i => <div key={i} className="h-56 bg-white/60 dark:bg-white/60 rounded-lg"></div>)}
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center bg-white dark:bg-white p-10 border border-gray-200 rounded-lg shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-900">Catálogo vacío</h3>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryName, items]) => (
            <section key={categoryName} className="mb-10">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-900 flex items-center gap-2 tracking-tight">
                  {categoryName.toUpperCase()} 
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-500 bg-white dark:bg-white border border-gray-200 px-2 py-0.5 rounded-md">{items.length}</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {items.map((product) => {
                  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
                                    || product.product_images?.[0]?.image_url 
                                    || '/placeholder.png'

                  return (
                    <Link href={user ? `/producto/${product.id}` : '/auth/login'} key={product.id} className="group">
                      <div className="bg-white dark:bg-white border border-gray-200 hover:border-red-700 rounded-lg overflow-hidden transition-colors flex flex-col h-full shadow-sm">
                        
                        <div className="h-24 md:h-32 w-full bg-gray-50 dark:bg-gray-50 relative overflow-hidden border-b border-gray-100">
                          <img src={primaryImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-1 right-1 bg-white/90 dark:bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-red-800 uppercase tracking-wider rounded shadow-sm">
                            {product.condition}
                          </div>
                        </div>

                        <div className="p-2 sm:p-3 flex flex-col flex-grow">
                          <h3 className="text-[11px] sm:text-xs text-gray-800 dark:text-gray-800 font-bold leading-tight line-clamp-2 mb-1 group-hover:text-red-800 transition-colors">
                            {product.title}
                          </h3>
                          <div className="text-sm md:text-base font-black text-gray-900 dark:text-gray-900 mb-1.5 mt-auto">
                            S/ {product.price.toFixed(2)}
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5" />
                              <span className="truncate">{product.categories?.name}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </main>
      
      <footer className="bg-white dark:bg-white border-t border-gray-200 mt-8 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-black text-gray-900 dark:text-gray-900 text-lg mb-1 tracking-tighter uppercase">Meca<span className="text-red-800">Store</span></p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-500">Plataforma comercial para estudiantes de ingeniería.</p>
        </div>
      </footer>
    </div>
  )
}