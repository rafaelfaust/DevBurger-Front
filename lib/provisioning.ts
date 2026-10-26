import { randomInt } from 'node:crypto'

import type { BrandingOverrides } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sampleProductImage, segmentPresets, type Segment } from '@/lib/segments'

// Endereços que não podem virar loja (subdomínios usados pela própria plataforma).
const reservedSlugs = new Set([
  'www', 'app', 'api', 'admin', 'img', 'static', 'cdn', 'mail', 'plataforma', 'suporte', 'status'
])

export const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

export function slugProblem(slug: string): string | null {
  if (!slugPattern.test(slug) || slug.includes('--')) {
    return 'Use de 3 a 40 letras minúsculas, números ou hífens, sem começar ou terminar com hífen'
  }
  if (reservedSlugs.has(slug)) return 'Este endereço é reservado pela plataforma'
  return null
}

// Senha provisória legível (sem 0/O, 1/l), mostrada uma única vez para quem criou a loja.
export function temporaryPassword(length = 10) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('')
}

export type NewTenant = {
  slug: string
  name: string
  segment: Segment
  branding?: BrandingOverrides
  hosts?: string[]
  owner: { name: string; email: string; password: string }
  // Cliente de demonstração (só o db:seed usa).
  demoCustomer?: { email: string; password: string }
}

// Cria a loja com o cardápio de exemplo do segmento e o usuário dono, numa transação.
export async function createTenant(input: NewTenant) {
  return getDb().transaction(async tx => {
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({
        slug: input.slug,
        name: input.name,
        segment: input.segment,
        branding: input.branding ?? {}
      })
      .returning()

    if (input.hosts?.length) {
      await tx
        .insert(schema.tenantDomains)
        .values(input.hosts.map(host => ({ host, tenantId: tenant.id })))
        .onConflictDoNothing()
    }

    const preset = segmentPresets[input.segment]
    const categories = await tx
      .insert(schema.categories)
      .values(preset.categories.map((name, position) => ({ tenantId: tenant.id, name, position })))
      .returning()

    await tx.insert(schema.products).values(
      preset.products.map(product => ({
        tenantId: tenant.id,
        categoryId: categories[product.category].id,
        name: product.name,
        priceCents: product.priceCents,
        offer: product.offer ?? false,
        imageUrl: sampleProductImage(input.segment)
      }))
    )

    await tx.insert(schema.users).values([
      {
        tenantId: tenant.id,
        name: input.owner.name,
        email: input.owner.email.trim().toLowerCase(),
        role: 'owner' as const,
        passwordHash: hashPassword(input.owner.password)
      },
      ...(input.demoCustomer
        ? [
            {
              tenantId: tenant.id,
              name: 'Cliente Demo',
              email: input.demoCustomer.email,
              role: 'customer' as const,
              passwordHash: hashPassword(input.demoCustomer.password)
            }
          ]
        : [])
    ])

    return tenant
  })
}
