import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'

import { Header } from '@/components/header'
import { Providers } from '@/components/providers'
import { getSessionUser } from '@/lib/auth'
import { getTenantBranding, getThemeStyle } from '@/lib/branding'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900']
})

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding()

  return {
    title: {
      default: branding.brandName,
      template: `%s | ${branding.brandName}`
    },
    description: branding.siteDescription
  }
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [user, branding] = await Promise.all([getSessionUser(), getTenantBranding()])
  const themeStyle = getThemeStyle(branding)

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${barlow.variable}`} style={themeStyle}>
        <Providers>
          <Header branding={branding} user={user} />
          {children}
          <footer>
            <span>{branding.brandWordmarkLead}</span>
            {branding.brandWordmarkTrail ? ` ${branding.brandWordmarkTrail}` : ''}
            {' · '}
            {branding.footerTagline}
          </footer>
        </Providers>
      </body>
    </html>
  )
}
