import type { Metadata } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'

import { Header } from '@/components/header'
import { Providers } from '@/components/providers'
import { getSessionUser } from '@/lib/auth'
import { branding, themeStyle } from '@/lib/branding'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: {
    default: branding.brandName,
    template: `%s | ${branding.brandName}`
  },
  description: branding.siteDescription
}

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser()

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${barlow.variable}`} style={themeStyle}>
        <Providers>
          <Header user={user} />
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
