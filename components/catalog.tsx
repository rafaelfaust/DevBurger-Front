'use client'

import { useMemo, useState } from 'react'

import { ProductCard } from '@/components/product-card'
import type { Category, Product } from '@/lib/types'

export function Catalog({
  products,
  categories,
  initialCategory = 0
}: {
  products: Product[]
  categories: Category[]
  initialCategory?: number
}) {
  const [active, setActive] = useState(initialCategory)
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
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}
