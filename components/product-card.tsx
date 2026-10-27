'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import { ProductDialog, type Menu } from '@/components/product-dialog'
import { formatCurrency } from '@/lib/format'
import { hasChoices } from '@/lib/product-options'
import type { Product } from '@/lib/types'

// Abaixo disso o card avisa "Últimas unidades".
const LOW_STOCK = 5

export function ProductCard({ product, menu }: { product: Product; menu: Menu }) {
  const { add, items } = useCart()
  const [open, setOpen] = useState(false)
  // stockLeft só existe quando a loja controla estoque deste produto.
  const soldOut = product.stockLeft === 0
  const inCart = items
    .filter(item => item.id === product.id)
    .reduce((total, item) => total + item.quantity, 0)
  const choices = hasChoices(product.options)

  function quickAdd() {
    // Produto com tamanho, sabores ou adicionais abre a janela de escolha.
    if (choices) {
      setOpen(true)
      return
    }
    if (product.stockLeft !== undefined && inCart >= product.stockLeft) {
      toast.error(`Só restam ${product.stockLeft} unidade(s) de ${product.name}`)
      return
    }
    add({ id: product.id, name: product.name, url: product.url, price: product.price, stockLeft: product.stockLeft })
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
        {!soldOut && (
          // Abre os detalhes (e o campo de observação) mesmo em produto simples.
          <button
            aria-label={`Ver ${product.name}`}
            className="product-open"
            onClick={() => setOpen(true)}
            type="button"
          />
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
          <strong>
            {product.options?.sizes.length ? <small>a partir de </small> : null}
            {formatCurrency(product.price)}
          </strong>
          <button
            aria-label={soldOut ? `${product.name} esgotado` : `Adicionar ${product.name}`}
            className="add-button"
            disabled={soldOut}
            onClick={quickAdd}
          >
            <Plus />
          </button>
        </div>
      </div>
      {open && (
        <ProductDialog inCart={inCart} menu={menu} onClose={() => setOpen(false)} product={product} />
      )}
    </article>
  )
}
