import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

async function main() {
  const migrationsFolder = './drizzle'

  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const client = postgres(process.env.DATABASE_URL, { max: 1 })
    await migrate(drizzle(client), { migrationsFolder })
    await client.end()
  } else {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    const { pgliteDir } = await import('@/lib/db')
    const client = new PGlite(pgliteDir)
    await migrate(drizzle(client), { migrationsFolder })
    await client.close()
  }

  console.log('Migrações aplicadas')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
