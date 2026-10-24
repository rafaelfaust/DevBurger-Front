'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import {
  orderStatusLabels,
  orderStatusTransitions,
  type OrderStatus as Status
} from '@/lib/order-status'

export function OrderStatus({
  orderId,
  initialStatus
}: {
  orderId: string
  initialStatus: Status
}) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const nextStatuses = orderStatusTransitions[status]

  async function update(nextStatus: Status) {
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
      disabled={loading || !nextStatuses.length}
      onChange={event => update(event.target.value as Status)}
      value={status}
    >
      <option value={status}>{orderStatusLabels[status]}</option>
      {nextStatuses.map(item => (
        <option key={item} value={item}>
          {orderStatusLabels[item]}
        </option>
      ))}
    </select>
  )
}
