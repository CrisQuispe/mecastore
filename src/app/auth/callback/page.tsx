'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mensaje, setMensaje] = useState('Preparando tu acceso a MecaStore...')
  
  // Esta variable evita que React ejecute la validación dos veces
  const procesado = useRef(false)

  useEffect(() => {
    const procesarLogin = async () => {
      // Si ya se procesó, nos detenemos
      if (procesado.current) return
      procesado.current = true

      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      // 1. SI HAY ERROR DE GOOGLE
      if (error) {
        toast.error('Fallo la autenticación con Google')
        setTimeout(() => router.push('/auth/login'), 2000)
        return
      }

      // 2. SI ATRAPAMOS EL CÓDIGO (Solo se ejecuta 1 vez)
      if (code) {
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (sessionError) {
          toast.error('El código expiró, intenta de nuevo')
          setTimeout(() => router.push('/auth/login'), 2000)
          return
        }

        if (data?.session) {
          const whatsapp = data.session.user.user_metadata?.whatsapp
          router.push(whatsapp ? '/' : '/completar-perfil')
          return
        }
      }

      // 3. RESPALDO: Verifica si ya inició sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const whatsapp = session.user.user_metadata?.whatsapp
        router.push(whatsapp ? '/' : '/completar-perfil')
      } else {
        router.push('/auth/login')
      }
    }
    
    procesarLogin()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Verificando tu cuenta</h2>
        <p className="text-sm font-bold text-gray-500 mt-2">{mensaje}</p>
      </div>
    </div>
  )
}