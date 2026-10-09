'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

export default function CompletarPerfilPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSaveWhatsApp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const whatsapp = formData.get('whatsapp') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Guardamos el número en los metadatos del usuario en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { whatsapp: whatsapp }
      })

      if (error) {
        toast.error('Error al guardar el número')
      } else {
        toast.success('¡Perfil completado con éxito!')
        setTimeout(() => router.push('/'), 1200)
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-red-950/20 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¡Un último paso!</h1>
        <p className="text-sm font-medium text-gray-500 mb-6">
          Para que los compradores o vendedores puedan contactarte, necesitamos tu número de WhatsApp.
        </p>
        
        <form onSubmit={handleSaveWhatsApp} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Número de WhatsApp</label>
            <input 
              type="tel" 
              name="whatsapp" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 font-medium"
              placeholder="Ej. 999111222"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md flex justify-center items-center gap-2"
          >
            {isLoading ? 'Guardando...' : 'Continuar a MecaStore'}
          </button>
        </form>
      </div>
    </div>
  )
}