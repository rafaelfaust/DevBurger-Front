import { ProductForm } from '@/components/product-form'
import { getCategories, getStoreSettings } from '@/lib/store'

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([getCategories(), getStoreSettings()])

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Novo produto</h1>
      </div>
      <ProductForm categories={categories} stockControl={settings.stockControl} />
    </>
  )
}
