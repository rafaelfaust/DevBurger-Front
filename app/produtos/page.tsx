import type { Metadata } from 'next'
import Image from 'next/image'

import { Catalog } from '@/components/catalog'
import { getCategories, getProducts } from '@/lib/api'
import { getTenantBranding } from '@/lib/branding'

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding()

  return {
    title: 'Cardápio',
    description: branding.productsDescription
  }
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const [{ categoria }, products, categories, branding] = await Promise.all([
    searchParams,
    getProducts(),
    getCategories(),
    getTenantBranding()
  ])

  return (
    <main>
      <section className="page-hero">
        <Image
          alt=""
          fill
          priority
          sizes="100vw"
          src="/assets/bannerProduct.webp"
        />
        <div>
          <p className="eyebrow">{branding.productsEyebrow}</p>
          <h1>{branding.productsTitle}</h1>
          <p>{branding.productsCopy}</p>
        </div>
      </section>
      <section className="section catalog-section">
        <Catalog
          categories={categories}
          initialCategory={Number(categoria) || 0}
          products={products}
        />
      </section>
    </main>
  )
}
