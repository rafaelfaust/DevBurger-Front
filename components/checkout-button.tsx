'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import type { PaymentMethod } from '@/lib/payment-methods'

export function CheckoutButton({
  paymentMethod,
  changeFor,
  customer,
  onSuccess
}: {
  paymentMethod: PaymentMethod | null
  changeFor: number | null
  customer: { name: string; phone: string; whatsappOptIn: boolean }
  onSuccess: () => void
}) {
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const online = paymentMethod === 'online'

  async function checkout() {
    if (!items.length || !paymentMethod) return
    if (customer.name.trim().length < 2) {
      toast.error('Informe seu nome')
      document.getElementById('customer-name')?.focus()
      return
    }
    if (customer.phone.replace(/\D/g, '').length < 10) {
      toast.error('Informe seu celular com DDD')
      document.getElementById('customer-phone')?.focus()
      return
    }
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ ...item.selection, id: item.id, quantity: item.quantity })),
          paymentMethod,
          changeFor,
          customer
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      onSuccess()
      clear()
      // URL completa: o checkout online leva para o Mercado Pago (outro domínio).
      window.location.href = data.checkoutUrl
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
