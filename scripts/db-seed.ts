import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Cria as lojas configuradas (branding padrão + APP_TENANT_CONFIG) com dados de demonstração.
// Lojas que já existem são ignoradas.
async function main() {
  const { eq } = await import('drizzle-orm')
  const { listConfiguredBrandings } = await import('@/lib/branding')
  const { getDb, schema } = await import('@/lib/db')
  const { hashPassword } = await import('@/lib/password')

  const db = getDb()

  for (const branding of listConfiguredBrandings()) {
    const slug = branding.namespace
    const [existing] = await db
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug))

    if (existing) {
      console.log(`- ${slug}: já existe`)
      continue
    }

    await db.transaction(async tx => {
      const [tenant] = await tx
        .insert(schema.tenants)
        .values({ slug, name: branding.brandName })
        .returning()

      const [highlights, combos, drinks] = await tx
        .insert(schema.categories)
        .values([
          { tenantId: tenant.id, name: 'Destaques', position: 0 },
          { tenantId: tenant.id, name: 'Combos', position: 1 },
          { tenantId: tenant.id, name: 'Bebidas', position: 2 }
        ])
        .returning()

      const { assets } = branding
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
