'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/platform/copy-button'
import { segmentPresets, segments, type Segment } from '@/lib/segments'

type Store = {
  id: string
  slug: string
  name: string
  segment: Segment
  active: boolean
  domains: string[]
  owners: Array<{ id: string; name: string; email: string | null }>
  url: string
}

async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

export function StoreManager({ store }: { store: Store }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirmingDisable, setConfirmingDisable] = useState(false)
  const [segment, setSegment] = useState(store.segment)
  const [newPassword, setNewPassword] = useState<{ email: string; password: string } | null>(null)
  const base = `/api/platform/stores/${store.id}`

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    try {
      await action()
      toast.success(success)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir')
    } finally {
      setBusy(false)
    }
  }

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const host = String(new FormData(formElement).get('host') ?? '')
    await run(() => call(`${base}/domains`, 'POST', { host }), 'Domínio adicionado')
    formElement.reset()
  }

  return (
    <div className="platform-sections">
      <section className="admin-form">
        <h2>Situação</h2>
        <div className="store-status-row">
          <span className={`status-pill ${store.active ? 'is-on' : 'is-off'}`}>
            {store.active ? 'Ativa' : 'Desativada'}
          </span>
          <p className="settings-hint">
            {store.active
              ? 'A loja está no ar e recebendo pedidos.'
              : 'A loja está fora do ar: o endereço mostra "loja não encontrada" e ninguém consegue pedir.'}
          </p>
        </div>
        {store.active && !confirmingDisable && (
          <button className="button button-danger" disabled={busy} onClick={() => setConfirmingDisable(true)} type="button">
            Desativar loja
          </button>
        )}
        {store.active && confirmingDisable && (
          <div className="confirm-box">
            <p>
              Desativar <strong>{store.name}</strong>? A loja sai do ar na hora. Os dados ficam
              guardados e dá para reativar depois.
            </p>
            <div className="platform-actions">
              <button
                className="button button-danger"
                disabled={busy}
                onClick={() => run(() => call(base, 'PATCH', { active: false }), 'Loja desativada').then(() => setConfirmingDisable(false))}
                type="button"
              >
                Sim, desativar
              </button>
              <button className="text-button" onClick={() => setConfirmingDisable(false)} type="button">
                Cancelar
              </button>
            </div>
          </div>
        )}
        {!store.active && (
          <button
            className="button"
            disabled={busy}
            onClick={() => run(() => call(base, 'PATCH', { active: true }), 'Loja reativada')}
            type="button"
          >
            Reativar loja
          </button>
        )}
      </section>

      <section className="admin-form">
        <h2>Tipo de loja</h2>
        <label htmlFor="manager-segment">
          Segmento
          <select id="manager-segment" onChange={event => setSegment(event.target.value as Segment)} value={segment}>
            {segments.map(item => (
              <option key={item} value={item}>
                {segmentPresets[item].label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button"
          disabled={busy || segment === store.segment}
          onClick={() => run(() => call(base, 'PATCH', { segment }), 'Segmento atualizado')}
          type="button"
        >
          Salvar segmento
        </button>
      </section>

      <section className="admin-form">
        <h2>Endereços</h2>
        <ul className="domain-list">
          <li>
            {store.url.replace(/^https?:\/\//, '')} <small className="settings-hint">(endereço da plataforma)</small>
          </li>
          {store.domains.map(host => (
            <li className="domain-row" key={host}>
              {host}
              <button
                aria-label={`Remover ${host}`}
                className="icon-button"
                disabled={busy}
                onClick={() => run(() => call(`${base}/domains`, 'DELETE', { host }), 'Domínio removido')}
                type="button"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form className="inline-form" onSubmit={addDomain}>
          <label className="sr-only" htmlFor="new-domain">
            Domínio próprio
          </label>
          <input id="new-domain" name="host" placeholder="pedidos.minhaloja.com.br" required />
          <button className="button" disabled={busy}>
            Adicionar
          </button>
        </form>
        <p className="settings-hint">
          Depois de cadastrar aqui, adicione o mesmo domínio em Vercel → Settings → Domains e
          aponte o DNS dele para a Vercel.
        </p>
      </section>

      <section className="admin-form">
        <h2>Acesso do dono</h2>
        {store.owners.map(owner => (
          <div className="owner-row" key={owner.id}>
            <div>
              <strong>{owner.name}</strong>
              <span className="settings-hint">{owner.email ?? "sem e-mail"}</span>
            </div>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                run(async () => setNewPassword(await call(`${base}/owner-password`, 'POST', { userId: owner.id })), 'Nova senha gerada')
              }
              type="button"
            >
              Gerar nova senha
            </button>
          </div>
        ))}
        {newPassword && (
          <div className="confirm-box">
            <p>
              Nova senha provisória de <strong>{newPassword.email}</strong>:{' '}
              <span className="mono">{newPassword.password}</span>
            </p>
            <p className="settings-hint">Ela aparece só agora. As sessões abertas desse dono foram encerradas.</p>
            <CopyButton label="Copiar senha" text={newPassword.password} />
          </div>
        )}
      </section>
    </div>
  )
}
