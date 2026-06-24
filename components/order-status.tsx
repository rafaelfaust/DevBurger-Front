'use client'

import { useState } from 'react'
import { toast } from 'sonner'

const statuses = [
  'Aguardando pagamento',
  'Pedido realizado',
  'Em Preparação',
  'Pronto',
  'A Caminho',
  'Entregue'
]

export function OrderStatus({
  orderId,
  initialStatus
}: {
  orderId: string
  initialStatus: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  async function update(nextStatus: string) {
    setLoading(true)
    const previous = status
    setStatus(nextStatus)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success('Status atualizado')
    } catch (error) {
      setStatus(previous)
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      disabled={loading}
      onChange={event => update(event.target.value)}
      value={status}
    >
      {!statuses.includes(status) && <option>{status}</option>}
      {statuses.map(item => (
        <option key={item}>{item}</option>
      ))}
    </select>
  )
}
