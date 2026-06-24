import type { Metadata } from 'next'
import Image from 'next/image'

import { AuthForm } from '@/components/auth-form'
import { getTenantBranding } from '@/lib/branding-server'

export const metadata: Metadata = { title: 'Criar conta' }

export default async function RegisterPage() {
  const branding = await getTenantBranding()

  return (
    <main className="auth-page">
      <div className="auth-art">
        <Image
          alt={branding.brandName}
          fill
          priority
          sizes="50vw"
          src={branding.assets.registerImagePath}
        />
      </div>
      <div className="auth-panel">
        <p className="eyebrow">Primeiro pedido?</p>
        <h1>Crie sua conta</h1>
        <p>Leva menos de um minuto e facilita seus próximos pedidos.</p>
        <AuthForm mode="register" />
      </div>
    </main>
  )
}
