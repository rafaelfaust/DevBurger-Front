import type { Metadata } from 'next'
import type { Viewport } from 'next'

import { Header } from '@/components/header'
import { PwaRegister } from '@/components/pwa-register'
import { Providers } from '@/components/providers'
import { getSessionUser } from '@/lib/auth'
import { getThemeStyle } from '@/lib/branding'
import { getTenantBranding } from '@/lib/branding-server'
import { getCurrentStoreStatus } from '@/lib/store'

export async function generateViewport(): Promise<Viewport> {
  const branding = await getTenantBranding()

  return {
    themeColor: branding.theme.primary,
    colorScheme: 'light',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover'
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding()

  return {
    title: {
      default: branding.brandName,
      template: `%s | ${branding.brandName}`
    },
    description: branding.siteDescription,
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: branding.brandName
    },
    icons: {
      icon: branding.assets.faviconPath,
      shortcut: branding.assets.faviconPath,
      apple: branding.assets.faviconPath
    }
  }
}

export default async function StoreLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding, storeStatus] = await Promise.all([
    getSessionUser(),
    getTenantBranding(),
    getCurrentStoreStatus().catch(() => null)
  ])
  const themeStyle = getThemeStyle(branding)

  return (
    <div className="store-shell" style={themeStyle}>
      <Providers>
        <PwaRegister />
        <Header branding={branding} user={user} />
        {storeStatus && !storeStatus.open && (
          <div className="store-closed-bar" role="status">
            <strong>Fechado agora</strong> · {storeStatus.label}. Você pode
            ver o cardápio e montar seu pedido.
          </div>
        )}
        {children}
        <footer>
          <span>{branding.brandWordmarkLead}</span>
          {branding.brandWordmarkTrail
            ? ` ${branding.brandWordmarkTrail}`
            : ''}
          {' · '}
          {branding.footerTagline}
        </footer>
      </Providers>
    </div>
  )
}
