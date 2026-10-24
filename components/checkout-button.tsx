'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import type { PaymentMethod } from '@/lib/payment-methods'

export function CheckoutButton({
  paymentMethod,
  changeFor
}: {
  paymentMethod: PaymentMethod | null
  changeFor: number | null
}) {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const online = paymentMethod === 'online'

  async function checkout() {
    if (!items.length || !paymentMethod) return
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ id: item.id, quantity: item.quantity })),
          paymentMethod,
          changeFor
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      clear()
      window.location.assign(data.checkoutUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Falha ao finalizar o pedido'
      )
      setLoading(false)
    }
  }

  return (
    <button
      className="button checkout-button"
      disabled={!items.length || !paymentMethod || loading}
      onClick={checkout}
    >
      {loading
        ? online
          ? 'Abrindo Mercado Pago...'
          : 'Enviando pedido...'
        : online
          ? 'Pagar com Mercado Pago'
          : 'Finalizar pedido'}
    </button>
  )
}
