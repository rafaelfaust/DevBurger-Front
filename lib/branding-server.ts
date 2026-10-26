import { cache } from 'react'

import { buildBranding } from '@/lib/branding'
import { getCurrentTenant } from '@/lib/tenant'

export const getTenantBranding = cache(async () => {
  // Sem loja (host desconhecido) a página ainda renderiza com a marca genérica;
  // quem precisa da loja (catálogo, pedidos) falha com "Loja não encontrada".
  const tenant = await getCurrentTenant().catch(() => null)
  if (!tenant) return buildBranding('storefront', 'Delivery')

  return buildBranding(tenant.slug, tenant.name, tenant.branding, tenant.segment)
})

export async function getSessionCookieNames() {
  const branding = await getTenantBranding()

  return {
    token: `${branding.namespace}_token`
  }
}
