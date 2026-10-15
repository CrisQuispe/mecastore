import { Metadata } from 'next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProductDetailClient from './ProductDetailClient'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

// GENERACIÓN DINÁMICA DE METADATOS PARA WHATSAPP / OPENGRAPH
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Asegurarnos de que params sea resuelto si es una promesa
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
    return {
      title: 'Producto no encontrado | MecaStore',
    }
  }

  const primaryImage = product.product_images?.[0]?.image_url || 'https://mecastore.vercel.app/placeholder.png'
  
  // CORRECCIÓN 1: Formatear el texto sin saltos de línea raros
  const titleText = `${product.title} - S/ ${product.price.toFixed(2)}`
  
  const descriptionText = product.description
    ? product.description.slice(0, 150).replace(/\n/g, ' ') + '...' // Reemplazar saltos de línea con espacios para SEO
    : 'Disponible en MecaStore, el marketplace de ingeniería.'

  return {
    title: `${titleText} | MecaStore`,
    description: descriptionText,
    openGraph: {
      title: titleText,
      description: descriptionText,
      url: `https://mecastore.vercel.app/producto/${resolvedParams.id}`,
      siteName: 'MecaStore',
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 600,
          alt: product.title,
        },
      ],
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

// COMPONENTE PRINCIPAL DE SERVIDOR
export default async function ProductDetailPage({ params }: Props) {
  // Asegurarnos de que params sea resuelto si es una promesa
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

  // 3. Obtener imágenes
  const imgUrls = product.product_images?.map((img: any) => img.image_url) || ['/placeholder.png']

  // 4. Verificar si está guardado por el usuario
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