import { and, asc, count, desc, eq, max } from 'drizzle-orm'

import { normalizeHost } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { requirePlatformAdmin } from '@/lib/platform-auth'
import { createTenant, slugProblem, temporaryPassword } from '@/lib/provisioning'
import type { Segment } from '@/lib/segments'
import { StoreError } from '@/lib/tenant'

// Endereço público da loja: subdomínio da plataforma, ou o domínio próprio, se houver.
export function storeUrl(slug: string, domains: string[] = []) {
  const platformDomain = process.env.PLATFORM_DOMAIN?.trim()
  if (platformDomain === 'localhost') return `http://${slug}.localhost:3000`
  if (platformDomain) return `https://${slug}.${platformDomain}`
  if (domains[0]) return `http://${domains[0]}:3000`
  return `http://${slug}.localhost:3000`
}

export async function listStores() {
  await requirePlatformAdmin()
  const db = getDb()

  const [tenants, orderStats, owners, domains] = await Promise.all([
    db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt)),
    db
      .select({
        tenantId: schema.orders.tenantId,
        orders: count(schema.orders.id),
        lastOrderAt: max(schema.orders.createdAt)
      })
      .from(schema.orders)
      .groupBy(schema.orders.tenantId),
    db
      .select({ tenantId: schema.users.tenantId, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.role, 'owner'))
      .orderBy(asc(schema.users.createdAt)),
    db.select().from(schema.tenantDomains)
  ])

  return tenants.map(tenant => {
    const stats = orderStats.find(item => item.tenantId === tenant.id)
    const hosts = domains.filter(item => item.tenantId === tenant.id).map(item => item.host)
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      segment: tenant.segment,
      active: tenant.active,
      createdAt: tenant.createdAt.toISOString(),
      ownerEmail: owners.find(item => item.tenantId === tenant.id)?.email ?? null,
      orders: stats?.orders ?? 0,
      lastOrderAt: stats?.lastOrderAt ? new Date(stats.lastOrderAt).toISOString() : null,
      url: storeUrl(tenant.slug, hosts)
    }
  })
}

export async function getStore(id: string) {
  await requirePlatformAdmin()
  const db = getDb()
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id))
  if (!tenant) throw new StoreError('Loja não encontrada', 404)

  const [domains, owners] = await Promise.all([
    db.select().from(schema.tenantDomains).where(eq(schema.tenantDomains.tenantId, id)),
    db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(and(eq(schema.users.tenantId, id), eq(schema.users.role, 'owner')))
      .orderBy(asc(schema.users.createdAt))
  ])
  const hosts = domains.map(item => item.host)

  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    segment: tenant.segment,
    active: tenant.active,
    createdAt: tenant.createdAt.toISOString(),
    domains: hosts,
    owners,
    url: storeUrl(tenant.slug, hosts)
  }
}

export async function createStore(input: {
  name: string
  slug: string
  segment: Segment
  ownerName: string
  ownerEmail: string
}) {
  await requirePlatformAdmin()
  const slug = input.slug.trim().toLowerCase()
  const problem = slugProblem(slug)
  if (problem) throw new StoreError(problem, 400)

  const [existing] = await getDb()
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug))
  if (existing) throw new StoreError('Já existe uma loja com este endereço', 409)

  const password = temporaryPassword()
  const tenant = await createTenant({
    slug,
    name: input.name.trim(),
    segment: input.segment,
    branding: { brandName: input.name.trim() },
    owner: { name: input.ownerName.trim(), email: input.ownerEmail, password }
  })

  return { id: tenant.id, slug, url: storeUrl(slug), ownerEmail: input.ownerEmail.trim().toLowerCase(), password }
}

export async function updateStore(id: string, input: { active?: boolean; segment?: Segment }) {
  await requirePlatformAdmin()
  const [updated] = await getDb()
    .update(schema.tenants)
    .set(input)
    .where(eq(schema.tenants.id, id))
    .returning({ id: schema.tenants.id })
  if (!updated) throw new StoreError('Loja não encontrada', 404)
}

const hostPattern = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export async function addStoreDomain(id: string, rawHost: string) {
  await requirePlatformAdmin()
  const host = normalizeHost(rawHost.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
  if (!hostPattern.test(host)) throw new StoreError('Domínio inválido. Ex.: pedidos.minhaloja.com.br', 400)

  const platformDomain = normalizeHost(process.env.PLATFORM_DOMAIN ?? '')
  if (platformDomain && (host === platformDomain || host.endsWith(`.${platformDomain}`))) {
    throw new StoreError('Subdomínios da plataforma já funcionam pelo endereço da loja; cadastre só domínios próprios', 400)
  }

  const inserted = await getDb()
    .insert(schema.tenantDomains)
    .values({ host, tenantId: id })
    .onConflictDoNothing()
    .returning({ host: schema.tenantDomains.host })
  if (!inserted.length) throw new StoreError('Este domínio já está em uso', 409)
  return host
}

export async function removeStoreDomain(id: string, host: string) {
  await requirePlatformAdmin()
  await getDb()
    .delete(schema.tenantDomains)
    .where(and(eq(schema.tenantDomains.tenantId, id), eq(schema.tenantDomains.host, normalizeHost(host))))
}

// Gera uma senha provisória nova para o dono e encerra as sessões abertas dele.
export async function resetOwnerPassword(tenantId: string, userId: string) {
  await requirePlatformAdmin()
  const db = getDb()
  const password = temporaryPassword()
  const [user] = await db
    .update(schema.users)
    .set({ passwordHash: hashPassword(password) })
    .where(
      and(eq(schema.users.id, userId), eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'owner'))
    )
    .returning({ id: schema.users.id, email: schema.users.email })
  if (!user) throw new StoreError('Dono da loja não encontrado', 404)

  await db.delete(schema.sessions).where(eq(schema.sessions.userId, user.id))
  return { email: user.email, password }
}
