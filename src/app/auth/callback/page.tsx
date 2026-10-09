'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mensaje, setMensaje] = useState('Preparando tu acceso a MecaStore...')

  useEffect(() => {
    const procesarLogin = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      // 1. SI SUPABASE O GOOGLE MANDAN UN ERROR EN LA URL, LO MOSTRAMOS
      if (error) {
        const errorReal = errorDescription ? errorDescription.replace(/\+/g, ' ') : 'Error de autenticación'
        setMensaje(`Error: ${errorReal}`)
        toast.error(`Fallo: ${errorReal}`)
        setTimeout(() => router.push('/auth/login'), 4000)
        return
      }

      // 2. SI TODO ESTÁ BIEN, ATRAPAMOS EL CÓDIGO
      if (code) {
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (sessionError) {
          toast.error('No se pudo validar la sesión')
          router.push('/auth/login')
          return
        }

        if (data?.session) {
          const whatsapp = data.session.user.user_metadata?.whatsapp
          router.push(whatsapp ? '/' : '/completar-perfil')
          return
        }
      }

      // 3. RESPALDO SI YA ESTABA LOGUEADO
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const whatsapp = user.user_metadata?.whatsapp
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
        <p className="text-sm font-bold text-red-600 mt-2">{mensaje}</p>
      </div>
    </div>
  )
}