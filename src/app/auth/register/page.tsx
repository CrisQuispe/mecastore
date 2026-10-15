'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [whatsappInput, setWhatsappInput] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Controlar que solo se ingresen números en el campo de WhatsApp
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, '')
    setWhatsappInput(onlyNums)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // --- VALIDACIÓN ESTRICTA DE WHATSAPP PARA PERÚ ---
    const whatsappRegex = /^9\d{8}$/;
    
    if (!whatsappRegex.test(whatsappInput)) {
      toast.error('El celular debe tener 9 dígitos y empezar con 9 (Ej: 987654321)')
      return // Detiene el registro si el número es inválido
    }
    // -------------------------------------------------

    setIsLoading(true)
    
    // Le agregamos el código de Perú internamente antes de guardar
    const finalPhone = `51${whatsappInput}`

    // Registra al usuario y guarda su número de WhatsApp en la base de datos
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          whatsapp: finalPhone // Guarda el número ya validado con el 51
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('¡Registro exitoso! Revisa tu correo.')
      setTimeout(() => router.push('/auth/login'), 2000)
    }
    
    setIsLoading(false)
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
        <h1 className="text-2xl font-black text-gray-900 text-center mb-1 tracking-tight">Crear Cuenta</h1>
        <p className="text-sm font-medium text-gray-500 text-center mb-6">Únete al Marketplace de Ingeniería</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Número de WhatsApp *</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:border-red-700 focus-within:ring-1 focus-within:ring-red-700 transition-all bg-white">
              <span className="bg-gray-100 px-3.5 py-3 text-gray-600 font-bold border-r border-gray-300 flex items-center gap-1 shrink-0 text-sm">
                🇵🇪 +51
              </span>
              <input 
                type="tel" 
                name="whatsapp" 
                required 
                maxLength={9}
                value={whatsappInput}
                onChange={handleWhatsappChange}
                className="w-full px-4 py-3 outline-none text-gray-900 font-medium bg-transparent"
                placeholder="999111222"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico *</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium"
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña *</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700 transition-all bg-white text-gray-900 dark:bg-white dark:text-gray-900 font-medium pr-12"
                placeholder="Mínimo 6 caracteres"
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
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-600 mt-6">
          ¿Ya tienes cuenta? <Link href="/auth/login" className="text-red-700 font-bold hover:underline">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  )
}