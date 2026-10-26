import type { Metadata } from 'next'
import type { Viewport } from 'next'

import { Header } from '@/components/header'
import { PwaRegister } from '@/components/pwa-register'
import { Providers } from '@/components/providers'
import { getSessionUser } from '@/lib/auth'
import { getThemeStyle } from '@/lib/branding'
import { getTenantBranding } from '@/lib/branding-server'
import { getCurrentStoreStatus } from '@/lib/store'
import { getCurrentTenant } from '@/lib/tenant'

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
  const [tenant, branding] = await Promise.all([
    getCurrentTenant().catch(() => null),
    getTenantBranding()
  ])
  if (!tenant) return { title: 'Loja indisponível', robots: { index: false } }

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
  const [tenant, user, branding, storeStatus] = await Promise.all([
    getCurrentTenant().catch(() => null),
    getSessionUser(),
    getTenantBranding(),
    getCurrentStoreStatus().catch(() => null)
  ])

  // Endereço sem loja ativa (desativada pela plataforma ou inexistente).
  if (!tenant) {
    return (
      <main className="store-unavailable">
        <h1>Loja indisponível</h1>
        <p>Esta loja não está recebendo pedidos no momento. Tente novamente mais tarde.</p>
      </main>
    )
  }

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
