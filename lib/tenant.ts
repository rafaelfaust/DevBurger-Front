import { eq } from 'drizzle-orm'
import { cache } from 'react'

import { getTenantBranding } from '@/lib/branding-server'
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

// A loja é resolvida pelo host (branding) e carregada do banco uma vez por request.
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const branding = await getTenantBranding()
  const [tenant] = await getDb()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, branding.namespace))

  if (!tenant || !tenant.active) {
    throw new StoreError(`Loja "${branding.namespace}" não encontrada`, 404)
  }

  return tenant
})
