// Tela de WhatsApp do painel da loja: conexão, textos dos avisos e últimos envios.
import { desc, eq } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { buildBranding } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'
import { getCurrentTenant, StoreError } from '@/lib/tenant'

import { getWhatsAppSession, isWhatsAppConfigured } from './index'
import { MAX_TEMPLATE_LENGTH, notifiableStatuses, type WhatsAppTemplates } from './templates'

export async function getWhatsAppAdmin() {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const configured = isWhatsAppConfigured()

  const recent = await getDb()
    .select({
      id: schema.whatsappOutbox.id,
      phone: schema.whatsappOutbox.phone,
      body: schema.whatsappOutbox.body,
      status: schema.whatsappOutbox.status,
      error: schema.whatsappOutbox.error,
      createdAt: schema.whatsappOutbox.createdAt
    })
    .from(schema.whatsappOutbox)
    .where(eq(schema.whatsappOutbox.tenantId, tenant.id))
    .orderBy(desc(schema.whatsappOutbox.id))
    .limit(15)

  return {
    configured,
    session: configured ? await getWhatsAppSession(tenant.id) : null,
    templates: tenant.whatsappTemplates,
    storeName: buildBranding(tenant.slug, tenant.name, tenant.branding, tenant.segment).brandName,
    pixKey: tenant.pixKey,
    recent: recent.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))
  }
}

export async function updateWhatsAppTemplates(input: WhatsAppTemplates) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()

  // Guarda só status conhecidos; texto vazio = volta ao padrão.
  const templates: WhatsAppTemplates = {}
  for (const status of notifiableStatuses) {
    const item = input[status]
    if (!item) continue
    const text = item.text?.trim() ?? ''
    if (text.length > MAX_TEMPLATE_LENGTH) {
      throw new StoreError(`Cada mensagem pode ter até ${MAX_TEMPLATE_LENGTH} caracteres`, 400)
    }
    templates[status] = { enabled: Boolean(item.enabled), ...(text && { text }) }
  }

  await getDb()
    .update(schema.tenants)
    .set({ whatsappTemplates: templates })
    .where(eq(schema.tenants.id, tenant.id))
}
