import type { MetadataRoute } from 'next'

import { getTenantBranding } from '@/lib/branding-server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getTenantBranding()

  return {
    name: branding.brandName,
    short_name: branding.brandName,
    description: branding.siteDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: branding.theme.paper,
    theme_color: branding.theme.primary,
    lang: 'pt-BR',
    icons: [
      {
        src: branding.assets.logoPath,
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: branding.assets.logoPath,
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: branding.assets.logoPath,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}