import type { Metadata } from 'next'
import Link from 'next/link'

import { formatDate } from '@/lib/format'
import { listStores } from '@/lib/platform'
import { segmentPresets } from '@/lib/segments'

export const metadata: Metadata = { title: 'Lojas' }

export default async function StoresPage() {
  const stores = await listStores()
  const active = stores.filter(store => store.active).length

  return (
    <>
      <div className="platform-heading">
        <div>
          <p className="eyebrow">Lojas</p>
          <h1>Lojas da plataforma</h1>
          <p className="settings-hint">
            {stores.length} {stores.length === 1 ? 'loja' : 'lojas'} · {active} ativas
          </p>
        </div>
        <Link className="button" href="/plataforma/lojas/nova">
          Criar loja
        </Link>
      </div>

      <div className="platform-table-wrap">
        <table className="platform-table">
          <thead>
            <tr>
              <th>Loja</th>
              <th>Segmento</th>
              <th>Dono</th>
              <th className="num">Pedidos</th>
              <th>Último pedido</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.id}>
                <td>
                  <Link className="platform-store-link" href={`/plataforma/lojas/${store.id}`}>
                    <strong>{store.name}</strong>
                    <small>{store.url.replace(/^https?:\/\//, '')}</small>
                  </Link>
                </td>
                <td>{segmentPresets[store.segment]?.label ?? store.segment}</td>
                <td>{store.ownerEmail ?? '—'}</td>
                <td className="num">{store.orders}</td>
                <td>{store.lastOrderAt ? formatDate(store.lastOrderAt) : '—'}</td>
                <td>
                  <span className={`status-pill ${store.active ? 'is-on' : 'is-off'}`}>
                    {store.active ? 'Ativa' : 'Desativada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!stores.length && <p className="settings-hint">Nenhuma loja ainda. Crie a primeira.</p>}
      </div>
    </>
  )
}
