'use client'

import { useMemo, useState } from 'react'

import { ProductCard } from '@/components/product-card'
import type { Menu } from '@/components/product-dialog'
import type { Category } from '@/lib/types'

export function Catalog({
  menu,
  categories,
  initialCategory = 0
}: {
  menu: Menu
  categories: Category[]
  initialCategory?: number
}) {
  const [active, setActive] = useState(initialCategory)
  const { products } = menu
  const filtered = useMemo(
    () =>
      active === 0
        ? products
        : products.filter(product => product.category_id === active),
    [active, products]
  )

  return (
    <>
      <div className="category-tabs" role="tablist">
        <button
          className={active === 0 ? 'active' : ''}
          onClick={() => setActive(0)}
        >
          Todos
        </button>
        {categories.map(category => (
          <button
            className={active === category.id ? 'active' : ''}
            key={category.id}
            onClick={() => setActive(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {filtered.map(product => (
          <ProductCard key={product.id} menu={menu} product={product} />
        ))}
      </div>
    </>
  )
}
