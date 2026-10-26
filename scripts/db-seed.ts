import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Cria as lojas descritas no .env (marca padrão + APP_TENANT_CONFIG) com o cardápio de exemplo do segmento.
// Lojas que já existem só recebem a marca (se ainda não tiverem) e os domínios que faltarem.
async function main() {
  const { eq } = await import('drizzle-orm')
  const { segmentPresets, sampleProductImage } = await import('@/lib/segments')
  const { listSeedTenants } = await import('@/lib/branding-seed')
  const { getDb, schema } = await import('@/lib/db')
  const { hashPassword } = await import('@/lib/password')

  const db = getDb()

  for (const seed of listSeedTenants()) {
    const { slug } = seed
    const [existing] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug))

    if (existing) {
      if (existing.segment === 'outro' && seed.segment !== 'outro') {
        await db
          .update(schema.tenants)
          .set({ segment: seed.segment })
          .where(eq(schema.tenants.id, existing.id))
      }
      if (!Object.keys(existing.branding).length && Object.keys(seed.branding).length) {
        await db
          .update(schema.tenants)
          .set({ branding: seed.branding })
          .where(eq(schema.tenants.id, existing.id))
      }
      if (seed.hosts.length) {
        await db
          .insert(schema.tenantDomains)
          .values(seed.hosts.map(host => ({ host, tenantId: existing.id })))
          .onConflictDoNothing()
      }
      console.log(`- ${slug}: já existe (segmento, marca e domínios conferidos)`)
      continue
    }

    await db.transaction(async tx => {
      const [tenant] = await tx
        .insert(schema.tenants)
        .values({ slug, name: seed.name, segment: seed.segment, branding: seed.branding })
        .returning()

      if (seed.hosts.length) {
        await tx
          .insert(schema.tenantDomains)
          .values(seed.hosts.map(host => ({ host, tenantId: tenant.id })))
          .onConflictDoNothing()
      }

      // Cardápio de exemplo do segmento.
      const preset = segmentPresets[seed.segment]
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
          imageUrl: sampleProductImage(seed.segment)
        }))
      )

      await tx.insert(schema.users).values([
        { tenantId: tenant.id, name: 'Administrador', email: `admin@${slug}.local`, role: 'owner', passwordHash: hashPassword('123456') },
        { tenantId: tenant.id, name: 'Cliente Demo', email: `cliente@${slug}.local`, role: 'customer', passwordHash: hashPassword('123456') }
      ])
    })

    console.log(`+ ${slug}: criada (admin@${slug}.local / 123456)`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
