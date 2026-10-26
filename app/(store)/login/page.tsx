import type { Metadata } from 'next'
import Image from 'next/image'

import { AuthForm } from '@/components/auth-form'
import { getTenantBranding } from '@/lib/branding-server'

export const metadata: Metadata = { title: 'Entrar' }

export default async function LoginPage() {
  const branding = await getTenantBranding()

  return (
    <main className="auth-page">
      <div className="auth-art">
        <Image
          alt={branding.brandName}
          fill
          priority
          sizes="50vw"
          src={branding.assets.loginImagePath}
        />
      </div>
      <div className="auth-panel">
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1>Entre para pedir</h1>
        <p>Use seus dados para acompanhar pedidos e finalizar o pagamento.</p>
        <AuthForm mode="login" />
      </div>
    </main>
  )
}
