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
      // 1. Verificar sesión de usuario
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // 2. Traer productos
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* 1. NAVBAR DINÁMICO COMPLETAMENTE RESTAURADO */}
      <nav className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl font-black text-red-800 tracking-tighter uppercase">Meca<span className="text-gray-900">Store</span></span>
          </Link>
          
          <div className="w-full max-w-xl relative group">
            <input 
              type="text" 
              placeholder="Buscar componentes, herramientas, software..." 
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
          </div>

          <div className="flex items-center gap-5">
            {user ? (
              // VISTA PARA USUARIOS CONECTADOS
              <>
                <Link href="/guardados" className="text-sm font-bold text-gray-600 hover:text-red-800 transition-colors flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" /> Guardados
                </Link>
                <Link href="/perfil" className="text-sm font-bold text-gray-600 hover:text-red-800 transition-colors flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Mi Perfil
                </Link>
                <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1.5">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
                <Link href="/vender" className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <ShoppingBag className="w-4 h-4" /> Vender
                </Link>
              </>
            ) : (
              // VISTA PARA VISITANTES (ESTILO ALIEXPRESS)
              <>
                <Link href="/auth/login" className="text-sm font-bold text-gray-600 hover:text-red-800 transition-colors flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Iniciar o Registrarse
                </Link>
                {/* Si no está registrado y quiere vender, lo mandamos al login primero */}
                <Link href="/auth/login" className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <ShoppingBag className="w-4 h-4" /> Vender
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. CINTA DE OPCIONES */}
      <div className="bg-gray-100 border-y border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-8 text-sm font-bold text-gray-600 overflow-x-auto">
          <span className="flex items-center gap-1.5 hover:text-red-700 cursor-pointer transition-colors"><Grid className="w-4 h-4"/> Todo el catálogo</span>
          <span className="flex items-center gap-1.5 hover:text-red-700 cursor-pointer transition-colors"><Cpu className="w-4 h-4"/> Electrónica</span>
          <span className="flex items-center gap-1.5 hover:text-red-700 cursor-pointer transition-colors"><Wrench className="w-4 h-4"/> Herramientas</span>
          <span className="flex items-center gap-1.5 hover:text-red-700 cursor-pointer transition-colors"><Code className="w-4 h-4"/> Software</span>
        </div>
      </div>
      
      {/* 3. BANNER PRINCIPAL */}
            <div className="bg-gradient-to-r from-red-950 via-red-800 to-red-900 border-b-2 border-red-950">
              <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center text-center">
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight uppercase shadow-sm">
                  Mercado de Ingeniería
                </h1>
                <p className="text-sm sm:text-base text-red-100 max-w-2xl font-medium">
                  Compra y venta directa de componentes, herramientas y proyectos.
                </p>
              </div>
            </div>

      {/* 4. CONTENIDO AGRUPADO */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
             {[1,2,3,4].map(i => <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>)}
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center bg-white p-12 border border-gray-200 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Catálogo vacío</h3>
            <p className="text-gray-500 mt-1 font-medium">Sé el primero en publicar un componente.</p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryName, items]) => (
            <section key={categoryName} className="mb-14">
              <div className="flex items-center justify-between mb-6 border-b-2 border-gray-100 pb-2">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  {categoryName.toUpperCase()} 
                  <span className="text-sm font-bold text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-md">{items.length}</span>
                </h2>
                <span className="text-sm font-bold text-red-700 hover:text-red-800 hover:underline cursor-pointer flex items-center">
                  Ver más <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              </div>

              {/* GRID AJUSTADO: 2 columnas en celular, 3 en tablet, 4 en PC */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((product) => {
                  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
                                    || product.product_images?.[0]?.image_url 
                                    || '/placeholder.png'

                  return (
                    // ENLACE CONDICIONAL: Si hay usuario va al producto, si no, va al login
                    <Link href={user ? `/producto/${product.id}` : '/auth/login'} key={product.id} className="group">
                      <div className="bg-white border border-gray-200 hover:border-red-700 rounded-lg overflow-hidden transition-colors flex flex-col h-full shadow-sm">
                        
                        {/* IMAGEN AJUSTADA: h-32 en celular, h-48 en pantallas más grandes */}
                        <div className="h-32 md:h-48 w-full bg-gray-100 relative overflow-hidden border-b border-gray-200">
                          <img src={primaryImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2 right-2 bg-red-50 px-2 py-1 border border-red-200 text-[10px] font-bold text-red-800 uppercase tracking-widest rounded shadow-sm">
                            {product.condition}
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-gray-800 font-bold leading-tight line-clamp-2 mb-2 group-hover:text-red-800 transition-colors">
                            {product.title}
                          </h3>
                          <div className="text-lg md:text-xl font-black text-gray-900 mb-2 mt-auto tracking-tight">
                            S/ {product.price.toFixed(2)}
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              <Tag className="w-3.5 h-3.5" />
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

      <footer className="bg-white border-t border-gray-200 mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-black text-gray-900 text-xl mb-2 tracking-tighter uppercase">Meca<span className="text-red-800">Store</span></p>
          <p className="text-sm font-medium text-gray-500">Plataforma comercial para estudiantes de ingeniería.</p>
        </div>
      </footer>
    </div>
  )
}