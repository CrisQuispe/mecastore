'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Trash2, CheckCircle, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return router.push('/auth/login')
      }

      // Verificar rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        toast.error('Acceso denegado. No eres administrador.')
        return router.push('/')
      }

      setIsAdmin(true)

      // Traer reportes pendientes con información del producto y del usuario que reportó
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          id, reason, status, created_at,
          product_id,
          products (title, price, seller_id),
          profiles:user_id (first_name, last_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (reportsData) setReports(reportsData)
      setIsLoading(false)
    }

    verifyAdminAndFetchData()
  }, [router, supabase])

  const handleDeleteProduct = async (productId: string, reportId: string) => {
    if (!window.confirm('¿Estás seguro de ELIMINAR esta publicación permanentemente?')) return

    // 1. Eliminar el producto
    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId)
    
    if (deleteError) {
      toast.error('Error al eliminar producto: ' + deleteError.message)
      return
    }

    // 2. Marcar reporte como resuelto
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)

    // 3. Actualizar UI
    setReports(reports.filter(r => r.id !== reportId))
    toast.success('Publicación eliminada correctamente.')
  }

  const handleDismissReport = async (reportId: string) => {
    if (!window.confirm('¿Descartar este reporte y mantener la publicación?')) return

    const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    
    if (error) {
      toast.error('Error al actualizar reporte.')
    } else {
      setReports(reports.filter(r => r.id !== reportId))
      toast.success('Reporte descartado.')
    }
  }

  if (isLoading) return <div className="min-h-screen bg-[#fdf4f4] flex items-center justify-center font-bold text-gray-500">Verificando credenciales...</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#fdf4f4] font-sans text-gray-900 pb-12">
      <Toaster position="top-center" />
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-700" />
            <span className="font-black text-lg text-gray-900 tracking-tight uppercase">Panel de Administración</span>
          </div>
          <Link href="/" className="text-gray-600 hover:text-red-800 flex items-center gap-2 text-sm font-bold transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <ArrowLeft className="w-4 h-4" /> Volver al Marketplace
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
          <Package className="w-6 h-6 text-red-700" /> Reportes Pendientes de Revisión ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm">
            <p className="font-bold text-gray-700">No hay reportes pendientes.</p>
            <p className="text-xs text-gray-400 mt-1">La comunidad se encuentra segura y sin incidencias.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      MOTIVO: {report.reason}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {report.products ? (
                    <>
                      <Link href={`/producto/${report.product_id}`} target="_blank" className="text-lg font-black text-gray-900 hover:text-red-700 transition-colors block">
                        {report.products.title} <span className="text-red-700 font-bold">(S/ {report.products.price.toFixed(2)})</span>
                      </Link>
                      <p className="text-xs font-medium text-gray-500">
                        Reportado por: <strong className="text-gray-800">{report.profiles?.first_name} {report.profiles?.last_name || ''}</strong>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 italic">El producto ya no existe (fue eliminado por el vendedor).</p>
                  )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  {report.products && (
                    <button 
                      onClick={() => handleDeleteProduct(report.product_id, report.id)}
                      className="flex-1 md:flex-none bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar Publicación
                    </button>
                  )}
                  <button 
                    onClick={() => handleDismissReport(report.id)}
                    className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}