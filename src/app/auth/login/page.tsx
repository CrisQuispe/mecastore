'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      toast.error(`Error al ingresar: ${error.message}`)
      setIsLoading(false)
      return
    }

    toast.success('¡Bienvenido de nuevo!')
    setTimeout(() => router.push('/'), 1500)
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-950 flex flex-col items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      
      {/* LOGO OFICIAL SOBRE LA CAJA */}
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
              onChange={handleChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium"
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              name="password" 
              required 
              onChange={handleChange} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium"
              placeholder="••••••••"
            />
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