'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

import { useCart } from '@/components/cart-context'
import { CheckoutButton } from '@/components/checkout-button'
import { formatCurrency } from '@/lib/format'

const deliveryFee = 5

export function CartView() {
  const { items, total, increase, decrease, remove } = useCart()

  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>Seu carrinho está vazio</h2>
        <p>Escolha um item do catálogo para continuar.</p>
      </div>
    )
  }

  return (
    <div className="cart-layout">
      <div className="cart-items">
        {items.map(item => (
          <article className="cart-item" key={item.id}>
            <Image alt={item.name} height={100} src={item.url} width={120} />
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              <p>{formatCurrency(item.price)}</p>
            </div>
            <div className="quantity">
              <button onClick={() => decrease(item.id)}>
                <Minus size={16} />
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => increase(item.id)}>
                <Plus size={16} />
              </button>
            </div>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
            <button
              aria-label={`Remover ${item.name}`}
              className="remove-button"
              onClick={() => remove(item.id)}
            >
              <Trash2 size={19} />
            </button>
          </article>
        ))}
      </div>
      <aside className="order-summary">
        <h2>Resumo do pedido</h2>
        <div>
          <span>Itens</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div>
          <span>Entrega</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="summary-total">
          <strong>Total</strong>
          <strong>{formatCurrency(total + deliveryFee)}</strong>
        </div>
        <CheckoutButton />
        <small>
          Pagamento processado em ambiente seguro pelo Mercado Pago.
        </small>
      </aside>
    </div>
  )
}
