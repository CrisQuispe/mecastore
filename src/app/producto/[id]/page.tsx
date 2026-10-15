import { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProductDetailClient from './ProductDetailClient'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: product } = await supabase
    .from('products')
    .select(`*, product_images(image_url)`)
    .eq('id', resolvedParams.id)
    .single()

  if (!product) {
    return { title: 'Producto no encontrado | MecaStore' }
  }

  const primaryImage = product.product_images?.[0]?.image_url || 'https://mecastore.vercel.app/placeholder.png'
  const titleText = `${product.title} - S/ ${product.price.toFixed(2)}`
  const descriptionText = product.description
    ? product.description.slice(0, 150).replace(/\n/g, ' ') + '...'
    : 'Disponible en MecaStore, el marketplace de ingeniería.'

  return {
    title: `${titleText} | MecaStore`,
    description: descriptionText,
    openGraph: {
      title: titleText,
      description: descriptionText,
      url: `https://mecastore.vercel.app/producto/${resolvedParams.id}`,
      siteName: 'MecaStore',
      images: [{ url: primaryImage, width: 800, height: 600, alt: product.title }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: descriptionText,
      images: [primaryImage],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params)
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Obtener producto y detalles
  const { data: product } = await supabase
    .from('products')
    .select(`*, categories(name), product_images(image_url), profiles(whatsapp)`)
    .eq('id', resolvedParams.id)
    .single()

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fdf4f4] flex items-center justify-center font-bold">
        Producto no encontrado.
      </div>
    )
  }

  // 3. LÓGICA INTELIGENTE DE VISTAS (Evitar spam y auto-visitas)
  const cookieName = `viewed_product_${resolvedParams.id}`
  const hasViewedBefore = cookieStore.get(cookieName)
  const isOwner = user && user.id === product.seller_id

  // Solo sumamos si NO es el dueño y NO lo ha visitado recientemente en esta sesión
  if (!isOwner && !hasViewedBefore) {
    await supabase
      .from('products')
      .update({ views: (product.views || 0) + 1 })
      .eq('id', resolvedParams.id)

    product.views = (product.views || 0) + 1

    // Guardamos una cookie que expire en 4 horas para que no vuelva a sumar por spam de recargas
    cookieStore.set({
      name: cookieName,
      value: 'true',
      maxAge: 60 * 60 * 4, // 4 horas
      path: '/',
    })
  }

  // 4. Obtener imágenes
  const imgUrls = product.product_images?.map((img: any) => img.image_url) || ['/placeholder.png']

  // 5. Verificar si está guardado por el usuario
  let initialIsSaved = false
  if (user) {
    const { data: savedData } = await supabase
      .from('saved_products')
      .select('id')
      .eq('product_id', resolvedParams.id)
      .eq('user_id', user.id)
      .single()

    if (savedData) initialIsSaved = true
  }

  return (
    <ProductDetailClient
      product={product}
      images={imgUrls}
      initialIsSaved={initialIsSaved}
      currentUser={user}
    />
  )
}