'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProductRowActions({ id, name, active }: { id: number; name: string; active: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function send(method: 'PATCH' | 'DELETE', success: string, body?: unknown) {
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success(success)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir')
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="row-actions">
        <span>Excluir {name}?</span>
        <button className="text-button danger" disabled={busy} onClick={() => send('DELETE', 'Produto excluído')} type="button">
          Sim, excluir
        </button>
        <button className="text-button" onClick={() => setConfirming(false)} type="button">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="row-actions">
      <Link className="text-button" href={`/admin/produtos/${id}`}>
        Editar
      </Link>
      <button
        className="text-button"
        disabled={busy}
        onClick={() =>
          send('PATCH', active ? 'Produto pausado: saiu do cardápio' : 'Produto de volta ao cardápio', { active: !active })
        }
        type="button"
      >
        {active ? 'Pausar' : 'Reativar'}
      </button>
      <button className="text-button danger" disabled={busy} onClick={() => setConfirming(true)} type="button">
        Excluir
      </button>
    </div>
  )
}
