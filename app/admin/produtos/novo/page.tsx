import { ProductForm } from '@/components/product-form'
import { getCategories } from '@/lib/store'

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Novo produto</h1>
      </div>
      <ProductForm categories={categories} />
    </>
  )
}
