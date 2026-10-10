'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

export default function CompletarPerfilPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const firstName = (formData.get('firstName') as string)?.trim()
    const lastName = (formData.get('lastName') as string)?.trim()
    let whatsappInput = (formData.get('whatsapp') as string)?.trim() || ''

    // Limpiar caracteres no numéricos
    let cleanPhone = whatsappInput.replace(/\D/g, '')

    // Si tiene 9 dígitos (ej. 997688441), le anteponemos el código de Perú 51
    if (cleanPhone.length === 9) {
      cleanPhone = `51${cleanPhone}`
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 1. Guardar o actualizar en la tabla 'profiles'
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName || null,
          whatsapp: cleanPhone
        })

      // 2. Guardar en los metadatos de Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          first_name: firstName,
          last_name: lastName,
          whatsapp: cleanPhone 
        }
      })

      if (dbError) {
        console.error('Error BD:', dbError)
        toast.error(`Error BD: ${dbError.message}`)
      } else if (authError) {
        console.error('Error Auth:', authError)
        toast.error(`Error Auth: ${authError.message}`)
      } else {
        toast.success('¡Perfil completado con éxito!')
        setTimeout(() => router.push('/'), 1200)
      }
    } else {
      toast.error('No se encontró sesión activa')
      router.push('/auth/login')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-red-950/20 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¡Completa tu Perfil!</h1>
        <p className="text-sm font-medium text-gray-500 mb-6">
          Ingresa tus datos personales para que compradores y vendedores puedan identificarte y contactarte fácilmente.
        </p>
        
        <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
            <input 
              type="text" 
              name="firstName" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 font-medium"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Apellido <span className="text-xs font-normal text-gray-400">(Opcional)</span>
            </label>
            <input 
              type="text" 
              name="lastName" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 font-medium"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Número de WhatsApp *</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-red-700 focus-within:ring-1 focus-within:ring-red-700 transition-all">
              <span className="bg-gray-100 px-3.5 py-3 text-gray-700 font-bold border-r border-gray-300 flex items-center gap-1 shrink-0 text-sm">
                🇵🇪 +51
              </span>
              <input 
                type="tel" 
                name="whatsapp" 
                required 
                maxLength={9}
                className="w-full px-4 py-3 outline-none bg-white text-gray-900 font-medium"
                placeholder=""
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Ingresa tus 9 dígitos. El código de Perú (+51) se agrega automáticamente[cite: 21].</p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-lg transition-colors shadow-md flex justify-center items-center gap-2 mt-6"
          >
            {isLoading ? 'Guardando...' : 'Finalizar y Entrar a MecaStore'}
          </button>
        </form>
      </div>
    </div>
  )
}