'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Función para Login con Correo
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciales incorrectas')
      setIsLoading(false)
    } else {
      verificarWhatsAppYRedirigir(data.user)
    }
  }

  // Función para Login con Google
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  // Verifica si el usuario ya registró su WhatsApp
  const verificarWhatsAppYRedirigir = (user: any) => {
    toast.success('¡Bienvenido de nuevo!')
    const whatsapp = user?.user_metadata?.whatsapp

    setTimeout(() => {
      if (!whatsapp) {
        // Si se registró con Google y no tiene WhatsApp, lo mandamos a pedirlo
        router.push('/completar-perfil')
      } else {
        router.push('/')
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      
      <Link href="/" className="mb-6 hover:scale-105 transition-transform">
        <span className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-md">
          Meca<span className="text-red-300">Store</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-red-950/20">
        <h1 className="text-2xl font-black text-gray-900 text-center mb-1 tracking-tight">Iniciar Sesión</h1>
        <p className="text-sm font-medium text-gray-500 text-center mb-6">Marketplace de Ingeniería</p>
        
        {/* BOTÓN DE GOOGLE */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-3 shadow-sm mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.2v3.15C3.18 21.32 7.24 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.2C.44 8.1 0 9.8 0 12s.44 3.9 1.2 5.42l4.08-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.18 2.68 1.2 6.58l4.08 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="px-3 text-xs font-bold text-gray-400 uppercase">o con correo</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 font-medium"
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 font-medium pr-12"
                placeholder="Contraseña"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-red-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-lg transition-colors mt-2 shadow-md flex justify-center items-center gap-2"
          >
            {isLoading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-600 mt-6">
          ¿No tienes cuenta? <Link href="/auth/register" className="text-red-700 font-bold hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}