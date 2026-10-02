'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

export default function EditarPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', condition: '', categoryId: ''
  })

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')

      const { data: cats } = await supabase.from('categories').select('*').order('name')
      if (cats) setCategories(cats)

      // Traer los datos actuales del producto
      const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single()
      
      if (product && product.seller_id === user.id) {
        setFormData({
          title: product.title,
          description: product.description,
          price: product.price.toString(),
          condition: product.condition,
          categoryId: product.category_id
        })
      } else {
        router.push('/perfil') // Si no es tuyo, te expulsa
      }
    }
    loadData()
  }, [params.id, router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase
      .from('products')
      .update({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        category_id: formData.categoryId
      })
      .eq('id', params.id)

    if (error) {
      toast.error('Error al actualizar')
    } else {
      toast.success('¡Producto actualizado!')
      setTimeout(() => router.push('/perfil'), 1500)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto">
        <Link href="/perfil" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver a Mi Perfil
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <h1 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Editar Producto</h1>
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del producto</label>
              <input name="title" value={formData.title} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-red-700" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio (S/)</label>
                <input name="price" type="number" step="0.10" value={formData.price} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-red-700" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Condición</label>
                <select name="condition" value={formData.condition} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-red-700 bg-white">
                  <option value="Nuevo">Nuevo</option>
                  <option value="Seminuevo">Seminuevo</option>
                  <option value="Para repuesto">Para repuesto</option>
                  <option value="Diseño propio">Diseño propio</option>
                  <option value="Prototipo">Prototipo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
              <select name="categoryId" value={formData.categoryId} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-red-700 bg-white">
                <option value="">Selecciona una...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea name="description" value={formData.description} rows={4} required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:border-red-700" />
            </div>

            <button disabled={isLoading} type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-4 rounded-md transition-colors flex justify-center items-center gap-2">
              <Save className="w-5 h-5" /> {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}