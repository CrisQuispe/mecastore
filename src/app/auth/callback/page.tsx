'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. Escuchar el cambio de estado de sesión (Supabase canjea el código automáticamente)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const whatsapp = session.user.user_metadata?.whatsapp
        router.push(whatsapp ? '/' : '/completar-perfil')
      }
    })

    // 2. Comprobación por si la sesión ya se activó antes de montar el componente
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const whatsapp = session.user.user_metadata?.whatsapp
        router.push(whatsapp ? '/' : '/completar-perfil')
      }
    }

    verificarSesion()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Verificando tu cuenta</h2>
        <p className="text-sm font-bold text-gray-500 mt-2">Iniciando sesión con Google...</p>
      </div>
    </div>
  )
}