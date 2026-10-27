'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/lib/types'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  function addToCart() {
    add(product)
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  return (
    <article className="product-card">
      <div className="product-image">
        <Image
          alt={product.name}
          fill
          sizes="(max-width: 700px) 100vw, 320px"
          src={product.url}
        />
        {product.offer && <span className="offer-badge">Oferta</span>}
      </div>
      <div className="product-content">
        <div>
          <h3>{product.name}</h3>
          {product.description && <p className="product-description">{product.description}</p>}
        </div>
        <div className="product-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button
            aria-label={`Adicionar ${product.name}`}
            className="add-button"
            onClick={addToCart}
          >
            <Plus />
          </button>
        </div>
      </div>
    </article>
  )
}
