import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { cache } from 'react'

import { normalizeHost, sanitizeNamespace } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'

export class StoreError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export type Tenant = typeof schema.tenants.$inferSelect

async function getRequestHost() {
  const headerStore = await headers()
  return normalizeHost(headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? '')
}

// Loja usada quando o host não é um domínio próprio nem subdomínio da plataforma
// (localhost, *.vercel.app...).
function defaultSlug() {
  return sanitizeNamespace(process.env.NEXT_PUBLIC_APP_NAMESPACE ?? '') || 'storefront'
}

// Subdomínio da plataforma: "pizzaria.devburger.app" → "pizzaria".
// Em desenvolvimento (sem PLATFORM_DOMAIN), "pizzaria.localhost" faz o mesmo papel.
function slugFromPlatformDomain(host: string) {
  const platformDomain = normalizeHost(process.env.PLATFORM_DOMAIN ?? '') || 'localhost'
  if (!platformDomain || !host.endsWith(`.${platformDomain}`)) return null

  const sub = host.slice(0, -(platformDomain.length + 1))
  return sub && !sub.includes('.') && sub !== 'www' ? sub : null
}

async function findTenant(host: string): Promise<Tenant | null> {
  const db = getDb()

  const [byDomain] = await db
    .select({ tenant: schema.tenants })
    .from(schema.tenantDomains)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.tenantDomains.tenantId))
    .where(eq(schema.tenantDomains.host, host))
  if (byDomain) return byDomain.tenant

  const slug = slugFromPlatformDomain(host) ?? defaultSlug()
  const [bySlug] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug))
  return bySlug ?? null
}

// A loja é resolvida pelo host da requisição e carregada uma vez por request.
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const tenant = await findTenant(await getRequestHost())

  if (!tenant || !tenant.active) {
    throw new StoreError('Loja não encontrada', 404)
  }

  return tenant
})
