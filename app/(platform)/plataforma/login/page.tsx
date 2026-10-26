import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'

import { PlatformLoginForm } from '@/components/platform/login-form'
import { getPlatformAdmin } from '@/lib/platform-auth'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PlatformLoginPage() {
  if (await getPlatformAdmin()) redirect('/plataforma')

  return (
    <main className="platform-login">
      <div className="platform-card">
        <p className="eyebrow">Plataforma</p>
        <h1>Entrar no painel</h1>
        <p className="settings-hint">Acesso restrito à equipe que administra as lojas.</p>
        <PlatformLoginForm />
      </div>
      <Toaster richColors position="top-right" />
    </main>
  )
}
