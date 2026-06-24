'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'

export function CheckoutButton() {
  const { items } = useCart()
  const [loading, setLoading] = useState(false)

  async function checkout() {
    if (!items.length) return
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ id: item.id, quantity: item.quantity }))
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      window.location.assign(data.checkoutUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Falha ao iniciar pagamento'
      )
      setLoading(false)
    }
  }

  return (
    <button
      className="button checkout-button"
      disabled={!items.length || loading}
      onClick={checkout}
    >
      {loading ? 'Abrindo Mercado Pago...' : 'Pagar com Mercado Pago'}
    </button>
  )
}
