import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isPlatformHost } from '@/lib/platform-auth'

export const metadata: Metadata = {
  title: { default: 'Plataforma', template: '%s | Plataforma' },
  robots: { index: false, follow: false }
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // No domínio de uma loja, /plataforma simplesmente não existe.
  if (!(await isPlatformHost())) notFound()
  return <div className="platform-shell">{children}</div>
}
