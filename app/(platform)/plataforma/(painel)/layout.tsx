import { LayoutGrid, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'

import { PlatformLogoutButton } from '@/components/platform/logout-button'
import { getPlatformAdmin } from '@/lib/platform-auth'

export default async function PlatformPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin()
  if (!admin) redirect('/plataforma/login')

  return (
    <>
      <header className="platform-header">
        <Link className="platform-brand" href="/plataforma">
          Plataforma
        </Link>
        <nav>
          <Link href="/plataforma">
            <LayoutGrid size={17} /> Lojas
          </Link>
          <Link href="/plataforma/lojas/nova">
            <PlusCircle size={17} /> Nova loja
          </Link>
        </nav>
        <div className="platform-user">
          <span>{admin.name}</span>
          <PlatformLogoutButton />
        </div>
      </header>
      <main className="platform-main">{children}</main>
      <Toaster richColors position="top-right" />
    </>
  )
}
