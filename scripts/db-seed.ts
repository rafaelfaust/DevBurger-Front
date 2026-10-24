import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Cria as lojas descritas no .env (marca padrão + APP_TENANT_CONFIG) com dados de demonstração.
// Lojas que já existem só recebem a marca (se ainda não tiverem) e os domínios que faltarem.
async function main() {
  const { eq } = await import('drizzle-orm')
  const { buildBranding } = await import('@/lib/branding')
  const { listSeedTenants } = await import('@/lib/branding-seed')
  const { getDb, schema } = await import('@/lib/db')
  const { hashPassword } = await import('@/lib/password')

  const db = getDb()

  for (const seed of listSeedTenants()) {
    const { slug } = seed
    const [existing] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug))

    if (existing) {
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
      console.log(`- ${slug}: já existe (marca e domínios conferidos)`)
      continue
    }

    await db.transaction(async tx => {
      const [tenant] = await tx
        .insert(schema.tenants)
        .values({ slug, name: seed.name, branding: seed.branding })
        .returning()

      if (seed.hosts.length) {
        await tx
          .insert(schema.tenantDomains)
          .values(seed.hosts.map(host => ({ host, tenantId: tenant.id })))
          .onConflictDoNothing()
      }

      const [highlights, combos, drinks] = await tx
        .insert(schema.categories)
        .values([
          { tenantId: tenant.id, name: 'Destaques', position: 0 },
          { tenantId: tenant.id, name: 'Combos', position: 1 },
          { tenantId: tenant.id, name: 'Bebidas', position: 2 }
        ])
        .returning()

      const { assets } = buildBranding(slug, seed.name, seed.branding)
      await tx.insert(schema.products).values([
        { tenantId: tenant.id, categoryId: highlights.id, name: 'Sanduiche Especial', priceCents: 2990, offer: true, imageUrl: assets.homeHeroPath },
        { tenantId: tenant.id, categoryId: highlights.id, name: 'Receita da Casa', priceCents: 3490, offer: true, imageUrl: assets.catalogHeroPath },
        { tenantId: tenant.id, categoryId: combos.id, name: 'Combo Premium', priceCents: 4290, imageUrl: assets.loginImagePath },
        { tenantId: tenant.id, categoryId: drinks.id, name: 'Bebida Gelada', priceCents: 800, imageUrl: assets.logoPath }
      ])

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
