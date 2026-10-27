import { notFound } from 'next/navigation'

import { ProductForm } from '@/components/product-form'
import { getAdminProduct, getCategories, StoreError } from '@/lib/store'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [product, categories] = await Promise.all([
    getAdminProduct(id).catch(error => {
      if (error instanceof StoreError && error.status === 404) notFound()
      throw error
    }),
    getCategories()
  ])

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Editar produto</h1>
      </div>
      <ProductForm categories={categories} product={product} />
    </>
  )
}
