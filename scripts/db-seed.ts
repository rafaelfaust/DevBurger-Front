import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Cria as lojas descritas no .env (marca padrão + APP_TENANT_CONFIG) com o cardápio de exemplo do segmento.
// Lojas que já existem só recebem a marca (se ainda não tiverem) e os domínios que faltarem.
async function main() {
  const { eq } = await import('drizzle-orm')
  const { createTenant } = await import('@/lib/provisioning')
  const { listSeedTenants } = await import('@/lib/branding-seed')
  const { getDb, schema } = await import('@/lib/db')

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

    await createTenant({
      slug,
      name: seed.name,
      segment: seed.segment,
      branding: seed.branding,
      hosts: seed.hosts,
      owner: { name: 'Administrador', email: `admin@${slug}.local`, password: '123456' },
      demoCustomer: { email: `cliente@${slug}.local`, password: '123456' }
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
