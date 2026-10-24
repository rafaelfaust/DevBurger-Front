'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { useCart } from '@/components/cart-context'
import { CheckoutButton } from '@/components/checkout-button'
import { formatCurrency } from '@/lib/format'
import { paymentMethodLabels, type PaymentMethod } from '@/lib/payment-methods'

export function CartView({
  deliveryFee,
  paymentMethods
}: {
  deliveryFee: number
  paymentMethods: PaymentMethod[]
}) {
  const { items, total, increase, decrease, remove } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    paymentMethods[0] ?? null
  )
  const [changeFor, setChangeFor] = useState('')
  const orderTotal = total + deliveryFee
  const changeValue = paymentMethod === 'cash' && changeFor ? Number(changeFor) : null

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
          <strong>{formatCurrency(orderTotal)}</strong>
        </div>
        <fieldset className="payment-options">
          <legend>Forma de pagamento</legend>
          {paymentMethods.map(method => (
            <label key={method}>
              <input
                checked={paymentMethod === method}
                id={`payment-${method}`}
                name="payment-method"
                onChange={() => setPaymentMethod(method)}
                type="radio"
                value={method}
              />
              {paymentMethodLabels[method]}
            </label>
          ))}
          {!paymentMethods.length && (
            <p>Esta loja não está aceitando pedidos no momento.</p>
          )}
          {paymentMethod === 'cash' && (
            <label className="change-for" htmlFor="change-for">
              Troco para quanto? (opcional)
              <input
                id="change-for"
                inputMode="decimal"
                min={orderTotal}
                onChange={event => setChangeFor(event.target.value)}
                placeholder={`Ex.: ${formatCurrency(Math.ceil(orderTotal / 10) * 10 + 10)}`}
                step="0.01"
                type="number"
                value={changeFor}
              />
            </label>
          )}
        </fieldset>
        <CheckoutButton changeFor={changeValue} paymentMethod={paymentMethod} />
        {paymentMethod === 'online' && (
          <small>
            Pagamento processado em ambiente seguro pelo Mercado Pago.
          </small>
        )}
      </aside>
    </div>
  )
}
