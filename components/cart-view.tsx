'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { useCart } from '@/components/cart-context'
import { CheckoutButton } from '@/components/checkout-button'
import { formatCurrency } from '@/lib/format'
import type { StoreStatus } from '@/lib/opening-hours'
import { paymentMethodLabels, type PaymentMethod } from '@/lib/payment-methods'

// Dados do cliente sem cadastro ficam no navegador para o próximo pedido.
const CUSTOMER_KEY = 'storefront:customer'

// Formata enquanto digita: 11987654321 -> (11) 98765-4321
function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export type CustomerPrefill = { name: string; phone: string } | null

function readSavedCustomer(): CustomerPrefill {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? 'null')
  } catch {
    // Sem acesso ao armazenamento do navegador: o cliente digita de novo.
    return null
  }
}

export function CartView({
  deliveryFee,
  paymentMethods,
  status,
  prefill
}: {
  deliveryFee: number
  paymentMethods: PaymentMethod[]
  status: StoreStatus
  // Conta logada: nome e telefone já vêm preenchidos.
  prefill: CustomerPrefill
}) {
  const { items, total, increase, decrease, remove } = useCart()
  // Lido uma vez: os campos só aparecem depois que o carrinho carrega no navegador,
  // então o HTML do servidor e o do cliente batem.
  const [saved] = useState(readSavedCustomer)
  const [customerName, setCustomerName] = useState(prefill?.name || saved?.name || '')
  const [customerPhone, setCustomerPhone] = useState(maskPhone(prefill?.phone || saved?.phone || ''))
  const [whatsappOptIn, setWhatsappOptIn] = useState(true)

  const rememberCustomer = () => {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: customerName, phone: customerPhone }))
    } catch {
      // Ignora: lembrar os dados é só uma conveniência.
    }
  }
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
          <article className="cart-item" key={item.key}>
            <Image alt={item.name} height={100} src={item.url} width={120} />
            <div className="cart-item-info">
              <h3>{item.name}</h3>
              {item.details && <p className="cart-item-details">{item.details}</p>}
              {item.selection?.note && <p className="cart-item-details">Obs.: {item.selection.note}</p>}
              <p>{formatCurrency(item.price)}</p>
            </div>
            <div className="quantity">
              <button onClick={() => decrease(item.key)}>
                <Minus size={16} />
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => increase(item.key)}>
                <Plus size={16} />
              </button>
            </div>
            <strong>{formatCurrency(item.price * item.quantity)}</strong>
            <button
              aria-label={`Remover ${item.name}`}
              className="remove-button"
              onClick={() => remove(item.key)}
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
        <fieldset className="payment-options customer-fields">
          <legend>Seus dados</legend>
          <label htmlFor="customer-name">
            Nome
            <input
              autoComplete="name"
              id="customer-name"
              maxLength={80}
              onChange={event => setCustomerName(event.target.value)}
              placeholder="Como devemos te chamar?"
              value={customerName}
            />
          </label>
          <label htmlFor="customer-phone">
            Celular (WhatsApp)
            <input
              autoComplete="tel-national"
              id="customer-phone"
              inputMode="tel"
              onChange={event => setCustomerPhone(maskPhone(event.target.value))}
              placeholder="(11) 98765-4321"
              value={customerPhone}
            />
          </label>
          <label className="optin" htmlFor="customer-optin">
            <input
              checked={whatsappOptIn}
              id="customer-optin"
              onChange={event => setWhatsappOptIn(event.target.checked)}
              type="checkbox"
            />
            Quero receber as atualizações do pedido no WhatsApp
          </label>
        </fieldset>
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
        {status.open ? (
          <CheckoutButton
            changeFor={changeValue}
            customer={{ name: customerName, phone: customerPhone, whatsappOptIn }}
            onSuccess={rememberCustomer}
            paymentMethod={paymentMethod}
          />
        ) : (
          <p className="checkout-closed">
            <strong>Loja fechada agora.</strong> {status.label}. Seu carrinho
            fica salvo até lá.
          </p>
        )}
        {paymentMethod === 'online' && (
          <small>
            Pagamento processado em ambiente seguro pelo Mercado Pago.
          </small>
        )}
      </aside>
    </div>
  )
}
