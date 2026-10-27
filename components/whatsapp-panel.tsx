'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { formatDate } from '@/lib/format'
import { formatBrPhone } from '@/lib/phone'
import type { WhatsAppSession } from '@/lib/whatsapp'
import {
  defaultTemplates,
  type MessageContext,
  notifiableStatuses,
  type NotifiableStatus,
  placeholders,
  renderMessage,
  resolveTemplate,
  templateLabels,
  type WhatsAppTemplate,
  type WhatsAppTemplates
} from '@/lib/whatsapp/templates'

type Recent = {
  id: number
  phone: string
  body: string
  status: 'pending' | 'sent' | 'failed'
  error: string | null
  createdAt: string
}

const statusLabel = { pending: 'Na fila', sent: 'Enviada', failed: 'Não enviada' } as const

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

export function WhatsAppPanel({
  configured,
  session: initialSession,
  templates: savedTemplates,
  storeName,
  pixKey,
  recent
}: {
  configured: boolean
  session: WhatsAppSession | null
  templates: WhatsAppTemplates
  storeName: string
  pixKey: string | null
  recent: Recent[]
}) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [busy, setBusy] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [templates, setTemplates] = useState<Record<NotifiableStatus, WhatsAppTemplate>>(() =>
    Object.fromEntries(
      notifiableStatuses.map(status => [status, resolveTemplate(savedTemplates, status)])
    ) as Record<NotifiableStatus, WhatsAppTemplate>
  )

  // Enquanto pareia, consulta a situação até o QR ser lido (ou expirar).
  const pairing = session?.status === 'connecting' || session?.status === 'qr'
  useEffect(() => {
    if (!pairing) return
    const timer = setInterval(async () => {
      try {
        const next = await call<WhatsAppSession>('/api/admin/whatsapp')
        setSession(next)
        if (next.status === 'connected') {
          toast.success('WhatsApp conectado')
          router.refresh()
        }
      } catch {
        // Falha pontual de rede: tenta de novo no próximo ciclo.
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [pairing, router])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir')
    } finally {
      setBusy(false)
    }
  }

  const connect = () => run(async () => setSession(await call('/api/admin/whatsapp', { method: 'POST' })))

  const disconnect = () =>
    run(async () => {
      setSession(await call('/api/admin/whatsapp', { method: 'DELETE' }))
      setConfirmDisconnect(false)
      toast.success('WhatsApp desconectado')
    })

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phone = String(new FormData(event.currentTarget).get('phone') ?? '')
    await run(async () => {
      await call('/api/admin/whatsapp/test', { method: 'POST', body: JSON.stringify({ phone }) })
      toast.success('Mensagem de teste enviada')
    })
  }

  const saveTemplates = () =>
    run(async () => {
      // Texto igual ao padrão não é guardado: assim melhorias do padrão chegam à loja.
      const payload = Object.fromEntries(
        notifiableStatuses.map(status => {
          const { enabled, text } = templates[status]
          return [status, { enabled, text: text.trim() === defaultTemplates[status].text ? '' : text }]
        })
      )
      await call('/api/admin/whatsapp/templates', { method: 'PUT', body: JSON.stringify(payload) })
      toast.success('Mensagens salvas')
      router.refresh()
    })

  const update = (status: NotifiableStatus, patch: Partial<WhatsAppTemplate>) =>
    setTemplates(current => ({ ...current, [status]: { ...current[status], ...patch } }))

  const sample: MessageContext = {
    customerName: 'Maria Souza',
    orderNumber: 'a1b2c3d4',
    storeName,
    items: [
      { quantity: 2, name: 'Produto de exemplo' },
      { quantity: 1, name: 'Bebida' }
    ],
    total: 'R$ 52,90',
    paymentMethod: 'PIX na entrega',
    changeFor: null,
    pixKey: pixKey ?? '(cadastre a chave em Configurações)'
  }

  return (
    <div className="whatsapp-panel">
      <section className="admin-form">
        <h2>Conexão</h2>
        {!configured && (
          <p className="settings-hint">
            O envio por WhatsApp ainda não foi ativado na plataforma. Fale com o suporte.
          </p>
        )}

        {configured && session?.status === 'connected' && (
          <>
            <div className="store-status is-open">
              <strong>Conectado</strong>
              <span>{session.phone ? formatBrPhone(session.phone) : 'número conectado'}</span>
            </div>
            <form className="inline-form" onSubmit={sendTest}>
              <label className="sr-only" htmlFor="test-phone">
                Celular para teste
              </label>
              <input id="test-phone" inputMode="tel" name="phone" placeholder="Celular para teste" required />
              <button className="button button-secondary" disabled={busy}>
                {busy ? 'Enviando...' : 'Enviar teste'}
              </button>
            </form>
            {confirmDisconnect ? (
              <div className="confirm-box">
                <p>Desconectar este número? Os avisos param até você conectar de novo.</p>
                <div className="platform-actions">
                  <button className="button button-danger" disabled={busy} onClick={disconnect} type="button">
                    Sim, desconectar
                  </button>
                  <button className="text-button" onClick={() => setConfirmDisconnect(false)} type="button">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button className="text-button danger" onClick={() => setConfirmDisconnect(true)} type="button">
                Desconectar WhatsApp
              </button>
            )}
          </>
        )}

        {configured && pairing && (
          <div className="whatsapp-pairing">
            {session?.qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR em data URL gerado no servidor
              <img alt="QR code para conectar o WhatsApp" height={240} src={session.qr} width={240} />
            ) : (
              <div className="qr-placeholder">Gerando QR code...</div>
            )}
            <ol>
              <li>Abra o WhatsApp no celular da loja.</li>
              <li>Toque em ⋮ (Android) ou Configurações (iPhone) → Dispositivos conectados.</li>
              <li>Toque em Conectar um dispositivo e aponte a câmera para o QR code.</li>
            </ol>
          </div>
        )}

        {configured && (!session || session.status === 'disconnected') && (
          <>
            <p className="settings-hint">
              Conecte o WhatsApp da loja para os clientes receberem os avisos do pedido. Use um número
              de WhatsApp Business da loja.
            </p>
            <button className="button" disabled={busy} onClick={connect} type="button">
              {busy ? 'Preparando...' : 'Conectar WhatsApp'}
            </button>
          </>
        )}

        <p className="settings-hint whatsapp-warning">
          A conexão funciona como o WhatsApp Web e não é um canal oficial do WhatsApp: em casos raros
          o número pode ser bloqueado. Por isso enviamos só avisos de pedidos, com intervalo entre as
          mensagens, e nunca mensagens em massa.
        </p>
      </section>

      <section className="admin-form">
        <h2>Mensagens de cada etapa</h2>
        <p className="settings-hint">
          Só recebe quem marcou &quot;Quero receber as atualizações&quot; no pedido. Campos disponíveis:
        </p>
        <ul className="placeholder-list">
          {placeholders.map(item => (
            <li key={item.key}>
              <code>{item.key}</code> {item.label}
            </li>
          ))}
        </ul>

        {notifiableStatuses.map(status => (
          <fieldset className="template-item" key={status}>
            <legend>
              <label className="checkbox" htmlFor={`tpl-${status}-on`}>
                <input
                  checked={templates[status].enabled}
                  id={`tpl-${status}-on`}
                  onChange={event => update(status, { enabled: event.target.checked })}
                  type="checkbox"
                />
                {templateLabels[status]}
              </label>
            </legend>
            {templates[status].enabled && (
              <div className="template-editor">
                <label htmlFor={`tpl-${status}`}>
                  Texto
                  <textarea
                    id={`tpl-${status}`}
                    maxLength={1000}
                    onChange={event => update(status, { text: event.target.value })}
                    rows={Math.min(10, templates[status].text.split('\n').length + 1)}
                    value={templates[status].text}
                  />
                </label>
                <div className="template-preview">
                  <span className="settings-hint">Como o cliente vê:</span>
                  <p>{renderMessage(templates[status].text, sample)}</p>
                </div>
                {templates[status].text !== defaultTemplates[status].text && (
                  <button
                    className="text-button"
                    onClick={() => update(status, { text: defaultTemplates[status].text })}
                    type="button"
                  >
                    Restaurar texto padrão
                  </button>
                )}
              </div>
            )}
          </fieldset>
        ))}

        <button className="button" disabled={busy} onClick={saveTemplates} type="button">
          Salvar mensagens
        </button>
      </section>

      <section className="admin-form">
        <h2>Últimos envios</h2>
        {!recent.length && <p className="settings-hint">Nenhum aviso enviado ainda.</p>}
        <ul className="outbox-list">
          {recent.map(item => (
            <li key={item.id}>
              <div>
                <strong>{formatBrPhone(item.phone)}</strong>
                <small className="settings-hint">{formatDate(item.createdAt)}</small>
              </div>
              <p>{item.body.split('\n')[0]}</p>
              <span className={`status-pill ${item.status === 'sent' ? 'is-on' : item.status === 'failed' ? 'is-off' : 'is-wait'}`}>
                {statusLabel[item.status]}
              </span>
              {item.error && <small className="settings-hint">{item.error}</small>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
