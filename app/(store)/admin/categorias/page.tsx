import { CategoryManager } from '@/components/category-manager'
import { getAdminCategories } from '@/lib/store'

export default async function CategoriesPage() {
  const categories = await getAdminCategories()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Catálogo</p>
        <h1>Categorias</h1>
        <p className="settings-hint">A ordem aqui é a ordem das abas do cardápio.</p>
      </div>
      <CategoryManager categories={categories} />
    </>
  )
}
