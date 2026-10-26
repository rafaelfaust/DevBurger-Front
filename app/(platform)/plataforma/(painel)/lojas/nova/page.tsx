import type { Metadata } from 'next'

import { NewStoreForm } from '@/components/platform/new-store-form'

export const metadata: Metadata = { title: 'Nova loja' }

export default function NewStorePage() {
  const platformDomain = process.env.PLATFORM_DOMAIN?.trim() || 'localhost:3000'

  return (
    <>
      <div className="platform-heading">
        <div>
          <p className="eyebrow">Lojas</p>
          <h1>Criar loja</h1>
          <p className="settings-hint">
            A loja já nasce com o cardápio de exemplo do segmento e um acesso para o dono.
          </p>
        </div>
      </div>
      <NewStoreForm platformDomain={platformDomain} />
    </>
  )
}
