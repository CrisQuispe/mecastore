'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, CheckCircle2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function EditarPerfilPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    whatsapp: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Buscar datos actuales en la tabla profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Si el número de WhatsApp guardado incluye el +51 o el 51, limpiamos para mostrar solo los 9 dígitos
        let rawPhone = profile.whatsapp || ''
        if (rawPhone.startsWith('51') && rawPhone.length === 11) {
          rawPhone = rawPhone.slice(2)
        } else if (rawPhone.startsWith('+51') && rawPhone.length === 12) {
          rawPhone = rawPhone.slice(3)
        }

        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          whatsapp: rawPhone
        })
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Si es el campo whatsapp, permitimos solo números
    if (e.target.name === 'whatsapp') {
      const onlyNums = e.target.value.replace(/[^0-9]/g, '')
      setFormData({ ...formData, whatsapp: onlyNums })
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    const firstName = formData.firstName.trim()
    const lastName = formData.lastName.trim()
    
    // --- VALIDACIÓN ESTRICTA DE WHATSAPP PARA PERÚ ---
    const whatsappRegex = /^9\d{8}$/;
    
    if (!whatsappRegex.test(formData.whatsapp)) {
      toast.error('El celular debe tener 9 dígitos y empezar con 9 (Ej: 987654321)')
      return // Bloquea el guardado
    }
    // -------------------------------------------------

    setIsSaving(true)

    // Agregamos el prefijo 51 para la base de datos
    const finalPhone = `51${formData.whatsapp}`

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 1. Actualizar en la tabla profiles
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName || null,
          whatsapp: finalPhone
        })
        .eq('id', user.id)

      // 2. Actualizar en Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          whatsapp: finalPhone
        }
      })

      if (dbError || authError) {
        toast.error('Error al actualizar la información')
      } else {
        toast.success('¡Perfil actualizado con éxito!')
        setTimeout(() => router.push('/perfil'), 1200)
      }
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#fdf4f4] flex items-center justify-center font-bold">Cargando perfil...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf4f4] via-white to-red-50/50 py-10 px-4 font-sans flex flex-col">
      <Toaster position="top-center" />
      
      <div className="max-w-md mx-auto w-full mb-4">
        <button 
          onClick={() => router.push('/perfil')}
          className="flex items-center gap-2 text-gray-600 hover:text-red-700 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-red-50 transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5" /> Volver al perfil
        </button>
      </div>

      <div className="max-w-md mx-auto w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(185,28,28,0.06)] p-6 sm:p-8 border border-red-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-red-700 to-red-900"></div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Editar mis datos</h1>
        <p className="text-sm font-medium text-gray-500 mb-6">Modifica tu nombre, apellido o número de contacto cuando desees.</p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Nombre *</label>
            <input 
              type="text" 
              name="firstName" 
              required 
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">
              Apellido <span className="text-xs font-normal text-gray-400">(Opcional)</span>
            </label>
            <input 
              type="text" 
              name="lastName" 
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-red-200 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 bg-red-50/30 font-medium text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Número de WhatsApp *</label>
            <div className="flex rounded-xl overflow-hidden border border-red-200 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/20 transition-all bg-red-50/30">
              <span className="bg-red-100/60 px-3.5 py-3 text-red-900 font-bold border-r border-red-200 flex items-center gap-1 shrink-0 text-sm">
                🇵🇪 +51
              </span>
              <input 
                type="tel" 
                name="whatsapp" 
                required 
                maxLength={9}
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-3 outline-none bg-transparent text-gray-900 font-medium"
                placeholder="999111222"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 mt-6"
          >
            {isSaving ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}