import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'

import { Header } from '@/components/header'
import { PwaRegister } from '@/components/pwa-register'
import { Providers } from '@/components/providers'
import { getSessionUser } from '@/lib/auth'
import { getThemeStyle } from '@/lib/branding'
import { getTenantBranding } from '@/lib/branding-server'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900']
})

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

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding] = await Promise.all([
    getSessionUser(),
    getTenantBranding()
  ])
  const themeStyle = getThemeStyle(branding)

  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${barlow.variable}`}
        style={themeStyle}
      >
        <Providers>
          <PwaRegister />
          <Header branding={branding} user={user} />
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
      </body>
    </html>
  )
}
