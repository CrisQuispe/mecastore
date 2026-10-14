'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Tag, ShoppingBag, ChevronRight, Grid, Cpu, Wrench, Code, User, LogOut, Bookmark, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// --- COMPONENTE: TARJETA DE PRODUCTO CON CARRUSEL TIPO ALIEXPRESS Y CATEGORÍA DINÁMICA ---
const ProductCard = ({ product, user }: { product: any, user: any }) => {
  const [currentImg, setCurrentImg] = useState(0)
  const images = product.product_images?.length > 0 
    ? product.product_images.map((img: any) => img.image_url) 
    : ['/placeholder.png']

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault() // Evita que se abra la página del producto al hacer clic en la flecha
    setCurrentImg((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length)
  }

  // CÁLCULO DE CATEGORÍA MOSTRADA (Soporta "Otros - [Detalle]")
  const displayCategory = product.custom_category
    ? `Otros - ${product.custom_category}`
    : product.categories?.name || 'General'

  return (
    <Link href={user ? `/producto/${product.id}` : '/auth/login'} className="group block h-full">
      <div className="bg-white dark:bg-white border border-gray-200 hover:border-red-700 rounded-lg overflow-hidden transition-colors flex flex-col h-full shadow-sm">
        
        {/* IMAGEN DEL PRODUCTO */}
        <div className="h-40 md:h-52 w-full bg-gray-50 dark:bg-gray-50 relative overflow-hidden border-b border-gray-100 group/image">
          <img src={images[currentImg]} alt={product.title} className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500" />
          
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-red-800 uppercase tracking-wider rounded shadow-sm z-10">
            {product.condition}
          </div>

          {/* FLECHAS Y PUNTITOS (Solo si hay más de 1 imagen) */}
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10 shadow-sm">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={nextImage} className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 rounded-full p-1 opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white z-10 shadow-sm">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                {images.map((_: any, i: number) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImg ? 'bg-red-600 scale-110' : 'bg-white/70'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-xs md:text-sm text-gray-800 dark:text-gray-800 font-bold leading-tight line-clamp-2 mb-1 group-hover:text-red-800 transition-colors">
            {product.title}
          </h3>
          <div className="text-base md:text-xl font-black text-gray-900 dark:text-gray-900 mb-1.5 mt-auto">
            S/ {product.price.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded w-fit">
            <Tag className="w-3 h-3" />
            <span className="truncate">{displayCategory}</span>
          </div>
        </div>

      </div>
    </Link>
  )
}
// ----------------------------------------------------------------------

export default function HomePage() {
  const supabase = createClient()
  const router = useRouter()
  
  // ESTADOS PRINCIPALES
  const [allProducts, setAllProducts] = useState<any[]>([]) // Guardar todos los productos crudos
  const [groupedProducts, setGroupedProducts] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // ESTADOS DE FILTRO Y BÚSQUEDA
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
      // 1. Extraemos la función para poder llamarla cuando queramos
      const fetchInitialData = async () => {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        const { data } = await supabase
          .from('products')
          .select(`*, categories(name), product_images(image_url, is_primary)`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (data) {
          setAllProducts(data)
          
          // Obtener categorías únicas reales para la cinta de opciones
          const uniqueCategories = Array.from(new Set(data.map(p => 
            p.custom_category ? `Otros - ${p.custom_category}` : (p.categories?.name || 'Otros')
          )))
          setAvailableCategories(uniqueCategories)
        }
        setIsLoading(false)
      }

      // 2. Cargamos los datos por primera vez al entrar a la página
      fetchInitialData()

      // 3. ¡LA MAGIA EN TIEMPO REAL! 
      // Nos suscribimos a cualquier cambio (INSERT, UPDATE, DELETE) en la tabla 'products'
      const channel = supabase
        .channel('realtime-products')
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'products' }, 
          (payload) => {
            console.log('¡Cambio detectado en la base de datos!', payload)
            // Cuando algo cambie (ej: borraste un producto), volvemos a traer los datos en silencio
            fetchInitialData()
          }
        )
        .subscribe()

      // 4. Limpiamos la suscripción si el usuario sale de la página
      return () => {
        supabase.removeChannel(channel)
      }
    }, [supabase])

  // EFECTO PARA FILTRAR EN TIEMPO REAL
  useEffect(() => {
    let filtered = allProducts

    // 1. Filtrar por término de búsqueda (título)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(term)
      )
    }

    // 2. Filtrar por categoría seleccionada
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        const catName = product.custom_category
          ? `Otros - ${product.custom_category}`
          : (product.categories?.name || 'Otros')
        return catName === selectedCategory
      })
    }

    // 3. Volver a agrupar los resultados filtrados
    const grouped = filtered.reduce((acc, product) => {
      const catName = product.custom_category
        ? `Otros - ${product.custom_category}`
        : (product.categories?.name || 'Otros')
      
      if (!acc[catName]) acc[catName] = []
      acc[catName].push(product)
      return acc
    }, {} as Record<string, any[]>)

    setGroupedProducts(grouped)
  }, [searchTerm, selectedCategory, allProducts])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  // Icono dinámico según el nombre de la categoría (puedes agregar más según tus categorías)
  const getCategoryIcon = (catName: string) => {
    const name = catName.toLowerCase()
    if (name.includes('electr')) return <Cpu className="w-3 h-3"/>
    if (name.includes('herramienta')) return <Wrench className="w-3 h-3"/>
    if (name.includes('software')) return <Code className="w-3 h-3"/>
    return <Tag className="w-3 h-3"/>
  }

  return (
    <div className="min-h-screen bg-[#fdf4f4] dark:bg-[#fdf4f4] font-sans text-gray-900 dark:text-gray-900">
      
      {/* 1. NAVBAR */}
      <nav className="bg-white dark:bg-white shadow-sm sticky top-0 z-50">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* 2. CINTA DE OPCIONES (CATEGORÍAS DINÁMICAS) */}
      <div className="bg-white/80 dark:bg-white/80 border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-8 text-xs font-bold text-gray-600 dark:text-gray-600 overflow-x-auto">
          <span 
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1 cursor-pointer transition-colors ${selectedCategory === null ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'hover:text-red-700'}`}
          >
            <Grid className="w-3 h-3"/> Todo el catálogo
          </span>
          
          {availableCategories.map(cat => (
            <span 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${selectedCategory === cat ? 'text-red-700 border-b-2 border-red-700 pb-1' : 'hover:text-red-700'}`}
            >
              {getCategoryIcon(cat)} {cat}
            </span>
          ))}
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

      {/* 4. CONTENIDO AGRUPADO Y FILTRADO */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
             {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white/60 dark:bg-white/60 rounded-lg"></div>)}
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center bg-white dark:bg-white p-10 border border-gray-200 rounded-lg shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-900">No se encontraron productos</h3>
            {(searchTerm || selectedCategory) && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                className="mt-4 text-sm text-red-600 hover:text-red-800 font-bold"
              >
                Limpiar filtros
              </button>
            )}
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
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} user={user} />
                ))}
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