import path from 'node:path'

import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '@/lib/db/schema'

export type Database = PostgresJsDatabase<typeof schema>

// Sem DATABASE_URL usamos PGlite (Postgres embutido) gravando em .data/pglite.
// Só serve para desenvolvimento: um processo por vez acessa o diretório.
export const pgliteDir = path.join(process.cwd(), '.data', 'pglite')

const globalForDb = globalThis as unknown as { db?: Database }

function createDatabase(): Database {
  const url = process.env.DATABASE_URL

  if (url) {
    const client = postgres(url, { max: process.env.VERCEL ? 1 : 10, prepare: false })
    return drizzlePostgres(client, { schema })
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL não configurada')
  }

  // As duas APIs do Drizzle são equivalentes para o que usamos.
  return drizzlePglite(new PGlite(pgliteDir), { schema }) as unknown as Database
}

export function getDb() {
  globalForDb.db ??= createDatabase()
  return globalForDb.db
}

export { schema }
