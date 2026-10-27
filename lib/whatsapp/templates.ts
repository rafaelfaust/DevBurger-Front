import type { OrderStatus } from '@/lib/order-status'

// Avisos que a loja pode mandar. "confirmed" = pedido recebido (na entrega) ou pago (online).
export const notifiableStatuses = [
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'canceled'
] as const satisfies readonly OrderStatus[]

export type NotifiableStatus = (typeof notifiableStatuses)[number]

export type WhatsAppTemplate = { enabled: boolean; text: string }
// Só o que a loja personalizou; o resto vem de defaultTemplates.
export type WhatsAppTemplates = Partial<Record<NotifiableStatus, Partial<WhatsAppTemplate>>>

export const templateLabels: Record<NotifiableStatus, string> = {
  confirmed: 'Pedido recebido',
  preparing: 'Em preparação',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  canceled: 'Cancelado'
}

// Poucos avisos ligados por padrão: menos mensagens, menos risco de bloqueio do número.
export const defaultTemplates: Record<NotifiableStatus, WhatsAppTemplate> = {
  confirmed: {
    enabled: true,
    text: [
      'Olá, {cliente}! Recebemos seu pedido {pedido} na {loja}.',
      '',
      '{itens}',
      'Total: {total} ({forma_pagamento})',
      '',
      'Vamos avisando por aqui a cada etapa.'
    ].join('\n')
  },
  preparing: {
    enabled: false,
    text: '{cliente}, seu pedido {pedido} já está sendo preparado!'
  },
  ready: {
    enabled: false,
    text: '{cliente}, seu pedido {pedido} está pronto!'
  },
  out_for_delivery: {
    enabled: true,
    text: '{cliente}, seu pedido {pedido} saiu para entrega e já está a caminho!'
  },
  delivered: {
    enabled: false,
    text: 'Pedido {pedido} entregue. Obrigado pela preferência, {cliente}!'
  },
  canceled: {
    enabled: true,
    text: 'Seu pedido {pedido} na {loja} foi cancelado. Qualquer dúvida, responda esta mensagem.'
  }
}

export const placeholders: Array<{ key: string; label: string }> = [
  { key: '{cliente}', label: 'primeiro nome do cliente' },
  { key: '{pedido}', label: 'número do pedido' },
  { key: '{loja}', label: 'nome da loja' },
  { key: '{itens}', label: 'lista de itens' },
  { key: '{total}', label: 'valor total' },
  { key: '{forma_pagamento}', label: 'forma de pagamento' },
  { key: '{troco}', label: 'troco para (só dinheiro)' },
  { key: '{chave_pix}', label: 'chave PIX da loja' }
]

export const MAX_TEMPLATE_LENGTH = 1000

export function resolveTemplate(custom: WhatsAppTemplates, status: NotifiableStatus): WhatsAppTemplate {
  const base = defaultTemplates[status]
  const own = custom[status] ?? {}
  return {
    enabled: own.enabled ?? base.enabled,
    text: own.text?.trim() ? own.text : base.text
  }
}

export type MessageContext = {
  customerName: string
  orderNumber: string
  storeName: string
  items: Array<{ quantity: number; name: string }>
  total: string
  paymentMethod: string
  changeFor: string | null
  pixKey: string | null
}

// Troca os campos {…} pelos dados do pedido; campo sem valor some (sem deixar "{troco}" no texto).
export function renderMessage(text: string, context: MessageContext) {
  const values: Record<string, string> = {
    '{cliente}': context.customerName.split(/\s+/)[0] ?? context.customerName,
    '{pedido}': `#${context.orderNumber}`,
    '{loja}': context.storeName,
    '{itens}': context.items.map(item => `${item.quantity}x ${item.name}`).join('\n'),
    '{total}': context.total,
    '{forma_pagamento}': context.paymentMethod,
    '{troco}': context.changeFor ?? '',
    '{chave_pix}': context.pixKey ?? ''
  }
  return text
    .replace(/\{[a-z_]+\}/g, key => values[key] ?? key)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
