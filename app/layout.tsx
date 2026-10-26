import { Barlow_Condensed, Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900']
})

// Raiz comum a loja e plataforma. Marca, tema e cabeçalho ficam em cada grupo:
// app/(store)/layout.tsx e app/(platform)/plataforma/layout.tsx.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${barlow.variable}`}>{children}</body>
    </html>
  )
}
