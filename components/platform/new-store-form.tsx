'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/platform/copy-button'
import { sanitizeNamespace } from '@/lib/branding'
import { DEFAULT_SEGMENT, segmentPresets, segments, type Segment } from '@/lib/segments'

type Created = { id: string; url: string; ownerEmail: string; password: string }

export function NewStoreForm({ platformDomain }: { platformDomain: string }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [created, setCreated] = useState<Created | null>(null)

  // Sugere o endereço a partir do nome até a pessoa editar o campo.
  const shownSlug = slugEdited ? slug : sanitizeNamespace(name).slice(0, 40)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/platform/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: shownSlug,
          segment: form.get('segment'),
          ownerName: form.get('ownerName'),
          ownerEmail: form.get('ownerEmail')
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setCreated(data)
      toast.success('Loja criada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a loja')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    const credentials = `Loja: ${created.url}\nPainel: ${created.url}/admin/pedidos\nE-mail: ${created.ownerEmail}\nSenha provisória: ${created.password}`
    return (
      <div className="admin-form platform-created">
        <h2>Loja criada</h2>
        <p className="settings-hint">
          Envie estes dados ao dono da loja. <strong>A senha provisória aparece só agora</strong>;
          se perder, gere outra na página da loja.
        </p>
        <dl className="credentials">
          <dt>Loja</dt>
          <dd>{created.url}</dd>
          <dt>Painel da loja</dt>
          <dd>{created.url}/admin/pedidos</dd>
          <dt>E-mail</dt>
          <dd>{created.ownerEmail}</dd>
          <dt>Senha provisória</dt>
          <dd className="mono">{created.password}</dd>
        </dl>
        <div className="platform-actions">
          <CopyButton label="Copiar dados de acesso" text={credentials} />
          <Link className="button" href={`/plataforma/lojas/${created.id}`}>
            Ver loja
          </Link>
        </div>
        {platformDomain !== 'localhost:3000' && (
          <p className="settings-hint">
            Enquanto o cadastro de domínio não for automático, adicione{' '}
            <strong>{created.url.replace(/^https?:\/\//, '')}</strong> em Vercel → Settings →
            Domains para o endereço abrir.
          </p>
        )}
      </div>
    )
  }

  return (
    <form className="admin-form platform-form" onSubmit={submit}>
      <fieldset className="settings-group">
        <legend>Loja</legend>
        <label htmlFor="store-name">
          Nome da loja
          <input
            id="store-name"
            maxLength={60}
            onChange={event => setName(event.target.value)}
            placeholder="Ex.: Pizzaria do Bairro"
            required
            value={name}
          />
        </label>
        <label htmlFor="store-slug">
          Endereço
          <div className="slug-field">
            <input
              id="store-slug"
              maxLength={40}
              onChange={event => {
                setSlugEdited(true)
                setSlug(sanitizeNamespace(event.target.value))
              }}
              placeholder="pizzaria-do-bairro"
              required
              value={shownSlug}
            />
            <span>.{platformDomain}</span>
          </div>
        </label>
        <label htmlFor="store-segment">
          Tipo de loja
          <select defaultValue={DEFAULT_SEGMENT} id="store-segment" name="segment">
            {segments.map(item => (
              <option key={item} value={item}>
                {segmentPresets[item as Segment].label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="settings-group">
        <legend>Dono da loja</legend>
        <label htmlFor="owner-name">
          Nome
          <input id="owner-name" maxLength={80} name="ownerName" required />
        </label>
        <label htmlFor="owner-email">
          E-mail (usado para entrar no painel da loja)
          <input id="owner-email" name="ownerEmail" required type="email" />
        </label>
      </fieldset>

      <button className="button" disabled={loading}>
        {loading ? 'Criando...' : 'Criar loja'}
      </button>
    </form>
  )
}
