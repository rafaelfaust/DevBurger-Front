'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import type { StoreSettings } from '@/lib/payment-methods'
import { halfPricingLabels, halfPricingRules } from '@/lib/product-options'

const offlineOptions = [
  { name: 'acceptsCash', label: 'Dinheiro na entrega' },
  { name: 'acceptsCardOnDelivery', label: 'Cartão na entrega (maquininha)' },
  { name: 'acceptsPixOnDelivery', label: 'PIX na entrega' }
] as const

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter()
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
          acceptsOnline: form.has('acceptsOnline'),
          stockControl: form.has('stockControl'),
          pixKey: String(form.get('pixKey') ?? ''),
          halfPricing: form.get('halfPricing')
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success('Configurações salvas')
      router.refresh()
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
        <label htmlFor="pixKey">
          Chave PIX da loja (opcional)
          <input
            defaultValue={settings.pixKey ?? ''}
            id="pixKey"
            maxLength={140}
            name="pixKey"
            placeholder="CNPJ, e-mail, celular ou chave aleatória"
          />
          <small className="settings-hint">
            Para quem recebe PIX direto, sem Mercado Pago. Use o campo {'{chave_pix}'} nas
            mensagens de WhatsApp para enviar a chave ao cliente.
          </small>
        </label>
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

      <fieldset className="settings-group">
        <legend>Estoque</legend>
        <label className="checkbox" htmlFor="stockControl">
          <input
            defaultChecked={settings.stockControl}
            id="stockControl"
            name="stockControl"
            type="checkbox"
          />
          Controlar estoque dos produtos
        </label>
        <p className="settings-hint">
          Ligado: cada produto ganha um campo de estoque (vazio = sem limite), os
          pedidos descontam as unidades e o produto aparece como esgotado ao zerar.
          Pedido cancelado devolve as unidades. Desligado: nada é contado; para
          tirar um item do cardápio, use Pausar.
        </p>
      </fieldset>

      <fieldset className="settings-group">
        <legend>Itens com vários sabores (meio a meio)</legend>
        {halfPricingRules.map(rule => (
          <label className="checkbox" htmlFor={`halfPricing-${rule}`} key={rule}>
            <input
              defaultChecked={settings.halfPricing === rule}
              id={`halfPricing-${rule}`}
              name="halfPricing"
              type="radio"
              value={rule}
            />
            {halfPricingLabels[rule]}
          </label>
        ))}
        <p className="settings-hint">
          Exemplo: pizza grande meio Calabresa (R$ 50) e meio Camarão (R$ 70). Pelo sabor mais caro o
          cliente paga R$ 70; pela média, R$ 60. Adicionais e borda são somados à parte.
        </p>
        <p className="settings-hint">
          Para usar: em Produtos, edite cada sabor e escolha &quot;Até 2 sabores&quot; (ou mais) em
          &quot;Sabores por item&quot;. Os sabores precisam estar na mesma categoria e ter tamanhos com o
          mesmo nome (ex.: Média e Grande em todas as pizzas).
        </p>
      </fieldset>

      <button className="button" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}
