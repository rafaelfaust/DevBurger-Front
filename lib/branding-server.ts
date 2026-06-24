import { headers } from 'next/headers'

import { resolveTenantBranding, normalizeHost } from '@/lib/branding'

async function getRequestHost(request?: Request) {
  if (request) {
    return normalizeHost(
      request.headers.get('x-forwarded-host') ??
        request.headers.get('host') ??
        new URL(request.url).host
    )
  }

  const headerStore = await headers()
  return normalizeHost(
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? ''
  )
}

export async function getTenantBranding(request?: Request) {
  const host = await getRequestHost(request)
  return resolveTenantBranding(host)
}

export async function getSessionCookieNames(request?: Request) {
  const branding = await getTenantBranding(request)

  return {
    token: `${branding.namespace}_token`,
    user: `${branding.namespace}_user`
  }
}