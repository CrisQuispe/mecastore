'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const procesarLogin = async () => {
      // 1. Atrapamos el código secreto que Google envía en la URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        // 2. Canjeamos el código por una sesión válida en Supabase
        const { data } = await supabase.auth.exchangeCodeForSession(code)
        
        if (data?.session) {
          const whatsapp = data.session.user.user_metadata?.whatsapp
          // Si tiene número va a la tienda, si no, va a completar su perfil
          router.push(whatsapp ? '/' : '/completar-perfil')
          return
        }
      }

      // 3. Respaldo: Si no hay código en la URL, verificamos si ya existe una sesión activa
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const whatsapp = user.user_metadata?.whatsapp
        router.push(whatsapp ? '/' : '/completar-perfil')
      } else {
        // Solo si todo falla, regresamos al login
        router.push('/auth/login')
      }
    }
    
    procesarLogin()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Verificando tu cuenta</h2>
        <p className="text-sm font-medium text-gray-500 mt-2">Preparando tu acceso a MecaStore...</p>
      </div>
    </div>
  )
}