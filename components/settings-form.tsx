'use client'

import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import type { StoreSettings } from '@/lib/payment-methods'

const offlineOptions = [
  { name: 'acceptsCash', label: 'Dinheiro na entrega' },
  { name: 'acceptsCardOnDelivery', label: 'Cartão na entrega (maquininha)' },
  { name: 'acceptsPixOnDelivery', label: 'PIX na entrega' }
] as const

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFee: Number(form.get('deliveryFee') ?? 0),
          acceptsCash: form.has('acceptsCash'),
          acceptsCardOnDelivery: form.has('acceptsCardOnDelivery'),
          acceptsPixOnDelivery: form.has('acceptsPixOnDelivery'),
          acceptsOnline: form.has('acceptsOnline')
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success('Configurações salvas')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label htmlFor="deliveryFee">
        Taxa de entrega (R$)
        <input
          defaultValue={settings.deliveryFee}
          id="deliveryFee"
          min="0"
          name="deliveryFee"
          required
          step="0.01"
          type="number"
        />
      </label>

      <fieldset className="settings-group">
        <legend>Pagamento na entrega</legend>
        {offlineOptions.map(option => (
          <label className="checkbox" htmlFor={option.name} key={option.name}>
            <input
              defaultChecked={settings[option.name]}
              id={option.name}
              name={option.name}
              type="checkbox"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="settings-group">
        <legend>Pagamento online</legend>
        <label className="checkbox" htmlFor="acceptsOnline">
          <input
            defaultChecked={settings.acceptsOnline}
            id="acceptsOnline"
            name="acceptsOnline"
            type="checkbox"
          />
          Aceitar pagamento online pelo Mercado Pago
        </label>
        {!settings.onlineAvailable && (
          <p className="settings-hint">
            O pagamento online ainda não está configurado nesta plataforma. A
            opção fica guardada e passa a aparecer para o cliente quando a
            conexão com o Mercado Pago estiver ativa.
          </p>
        )}
      </fieldset>

      <button className="button" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}
