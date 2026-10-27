'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/lib/types'

// Abaixo disso o card avisa "Últimas unidades".
const LOW_STOCK = 5

export function ProductCard({ product }: { product: Product }) {
  const { add, items } = useCart()
  // stockLeft só existe quando a loja controla estoque deste produto.
  const soldOut = product.stockLeft === 0
  const inCart = items.find(item => item.id === product.id)?.quantity ?? 0

  function addToCart() {
    if (product.stockLeft !== undefined && inCart >= product.stockLeft) {
      toast.error(`Só restam ${product.stockLeft} unidade(s) de ${product.name}`)
      return
    }
    add(product)
    toast.success(`${product.name} adicionado ao carrinho`)
  }

  return (
    <article className={soldOut ? 'product-card is-sold-out' : 'product-card'}>
      <div className="product-image">
        <Image
          alt={product.name}
          fill
          sizes="(max-width: 700px) 100vw, 320px"
          src={product.url}
        />
        {soldOut ? (
          <span className="offer-badge sold-out-badge">Esgotado</span>
        ) : (
          product.offer && <span className="offer-badge">Oferta</span>
        )}
      </div>
      <div className="product-content">
        <div>
          <h3>{product.name}</h3>
          {product.description && <p className="product-description">{product.description}</p>}
          {!soldOut && product.stockLeft !== undefined && product.stockLeft <= LOW_STOCK && (
            <p className="low-stock">
              {product.stockLeft === 1 ? 'Última unidade' : `Últimas ${product.stockLeft} unidades`}
            </p>
          )}
        </div>
        <div className="product-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button
            aria-label={soldOut ? `${product.name} esgotado` : `Adicionar ${product.name}`}
            className="add-button"
            disabled={soldOut}
            onClick={addToCart}
          >
            <Plus />
          </button>
        </div>
      </div>
    </article>
  )
}
