import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { StoreManager } from '@/components/platform/store-manager'
import { formatDate } from '@/lib/format'
import { getStore } from '@/lib/platform'
import { StoreError } from '@/lib/tenant'

export const metadata: Metadata = { title: 'Loja' }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()

  const store = await getStore(id).catch(error => {
    if (error instanceof StoreError && error.status === 404) notFound()
    throw error
  })

  return (
    <>
      <div className="platform-heading">
        <div>
          <p className="eyebrow">Loja · criada em {formatDate(store.createdAt)}</p>
          <h1>{store.name}</h1>
          <p className="settings-hint">
            <a href={store.url} rel="noreferrer" target="_blank">
              {store.url.replace(/^https?:\/\//, '')}
            </a>
            {' · '}
            <a href={`${store.url}/admin/pedidos`} rel="noreferrer" target="_blank">
              Painel da loja
            </a>
          </p>
        </div>
      </div>
      <StoreManager store={store} />
    </>
  )
}
