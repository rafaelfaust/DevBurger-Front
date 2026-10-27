// Avisos de status do pedido: enfileira na mudança de status e envia em segundo plano.
import { and, asc, eq, lt } from 'drizzle-orm'
import { after } from 'next/server'

import { buildBranding } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'
import { formatCurrency } from '@/lib/format'
import type { OrderStatus } from '@/lib/order-status'
import { paymentMethodShortLabels } from '@/lib/payment-methods'

import { getWhatsAppSession, isWhatsAppConfigured, withWhatsApp, WhatsAppError } from './index'
import {
  notifiableStatuses,
  type MessageContext,
  type NotifiableStatus,
  renderMessage,
  resolveTemplate
} from './templates'

// Aviso velho não vale mais a pena ("saiu para entrega" horas depois confunde o cliente).
const STALE_MINUTES = 30
const MAX_ATTEMPTS = 3
// A função tem 60 s: só começa um envio novo nos primeiros 30 s (cada envio leva até ~16 s).
// O que sobrar sai no próximo envio.
const DRAIN_LEASE_MS = 60_000
const SEND_BUDGET_MS = 30_000

const isNotifiable = (status: OrderStatus): status is NotifiableStatus =>
  (notifiableStatuses as readonly string[]).includes(status)

type Tenant = typeof schema.tenants.$inferSelect

async function loadOrderContext(orderId: string) {
  const db = getDb()
  const [row] = await db
    .select({ order: schema.orders, tenant: schema.tenants })
    .from(schema.orders)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.orders.tenantId))
    .where(eq(schema.orders.id, orderId))
  if (!row) return null

  const items = await db
    .select({
      quantity: schema.orderItems.quantity,
      name: schema.orderItems.name,
      details: schema.orderItems.details
    })
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId))
    .orderBy(asc(schema.orderItems.id))

  return { ...row, items }
}

export function messageContext(
  order: typeof schema.orders.$inferSelect,
  tenant: Tenant,
  items: Array<{ quantity: number; name: string; details?: string | null }>
): MessageContext {
  return {
    customerName: order.customerName ?? 'cliente',
    orderNumber: order.id.slice(-8),
    storeName: buildBranding(tenant.slug, tenant.name, tenant.branding, tenant.segment).brandName,
    items,
    total: formatCurrency(order.totalCents / 100),
    paymentMethod: paymentMethodShortLabels[order.paymentMethod],
    changeFor: order.changeForCents === null ? null : formatCurrency(order.changeForCents / 100),
    pixKey: tenant.pixKey
  }
}

// Texto do aviso para o status atual (também usado no botão manual do painel).
export function orderMessage(
  order: typeof schema.orders.$inferSelect,
  tenant: Tenant,
  items: Array<{ quantity: number; name: string; details?: string | null }>
) {
  if (!isNotifiable(order.status)) return null
  const template = resolveTemplate(tenant.whatsappTemplates, order.status)
  return renderMessage(template.text, messageContext(order, tenant, items))
}

// Enfileira o aviso do status e agenda o envio. Nunca lança: aviso é secundário ao pedido.
export async function notifyOrder(orderId: string, status: OrderStatus) {
  try {
    if (!isNotifiable(status)) return
    const loaded = await loadOrderContext(orderId)
    if (!loaded) return
    const { order, tenant, items } = loaded
    if (!order.whatsappOptIn || !order.customerPhone) return

    const template = resolveTemplate(tenant.whatsappTemplates, status)
    if (!template.enabled) return

    await getDb()
      .insert(schema.whatsappOutbox)
      .values({
        tenantId: tenant.id,
        orderId: order.id,
        phone: order.customerPhone,
        body: renderMessage(template.text, messageContext({ ...order, status }, tenant, items))
      })

    after(() => drainOutbox(tenant.id))
  } catch (error) {
    console.error('[whatsapp] falha ao enfileirar aviso', orderId, error)
  }
}

// Envia as mensagens pendentes da loja numa única conexão.
export async function drainOutbox(tenantId: string) {
  if (!isWhatsAppConfigured()) return
  const db = getDb()
  const outbox = schema.whatsappOutbox

  await db
    .update(outbox)
    .set({ status: 'failed', error: 'Aviso expirou antes de ser enviado' })
    .where(
      and(
        eq(outbox.tenantId, tenantId),
        eq(outbox.status, 'pending'),
        lt(outbox.createdAt, new Date(Date.now() - STALE_MINUTES * 60_000))
      )
    )

  const session = await getWhatsAppSession(tenantId)
  if (session.status !== 'connected') return // fica pendente; o painel mostra o botão manual

  const startedAt = Date.now()
  try {
    // waitMs curto: se outra função já está enviando, ela pega as mensagens novas.
    await withWhatsApp(
      tenantId,
      async send => {
        const hasTime = () => Date.now() - startedAt < SEND_BUDGET_MS
        while (hasTime()) {
          const batch = await db
            .select()
            .from(outbox)
            .where(and(eq(outbox.tenantId, tenantId), eq(outbox.status, 'pending')))
            .orderBy(asc(outbox.id))
            .limit(20)
          if (!batch.length) return

          for (const message of batch) {
            if (!hasTime()) return
            try {
              await send(message.phone, message.body)
              await db
                .update(outbox)
                .set({ status: 'sent', sentAt: new Date(), attempts: message.attempts + 1, error: null })
                .where(eq(outbox.id, message.id))
            } catch (error) {
              const attempts = message.attempts + 1
              const final =
                (error instanceof WhatsAppError && error.code === 'not_on_whatsapp') || attempts >= MAX_ATTEMPTS
              await db
                .update(outbox)
                .set({
                  status: final ? 'failed' : 'pending',
                  attempts,
                  error: error instanceof Error ? error.message.slice(0, 300) : 'Falha ao enviar'
                })
                .where(eq(outbox.id, message.id))
              if (!final) throw error // conexão instável: tenta de novo no próximo envio
            }
          }
        }
      },
      { leaseMs: DRAIN_LEASE_MS, waitMs: 1000 }
    )
  } catch (error) {
    if (error instanceof WhatsAppError && error.code === 'busy') return
    console.error('[whatsapp] falha ao enviar fila', tenantId, error)
  }
}
