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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciales incorrectas')
      setIsLoading(false)
    } else {
      toast.success('¡Bienvenido de nuevo!')
      setTimeout(() => router.push('/'), 1500)
    }
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
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium pr-12"
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