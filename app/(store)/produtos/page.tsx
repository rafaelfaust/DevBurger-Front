import type { Metadata } from 'next'
import Image from 'next/image'

import { Catalog } from '@/components/catalog'
import { getCategories, getMenu } from '@/lib/store'
import { getTenantBranding } from '@/lib/branding-server'

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
  const [{ categoria }, menu, categories, branding] = await Promise.all([
    searchParams,
    getMenu(),
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
          src={branding.assets.catalogHeroPath}
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
          menu={menu}
        />
      </section>
    </main>
  )
}
