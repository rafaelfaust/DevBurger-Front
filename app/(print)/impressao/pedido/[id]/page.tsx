import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AutoPrint } from '@/components/auto-print'
import { getSessionUser } from '@/lib/auth'
import { getTenantBranding } from '@/lib/branding-server'
import { formatCurrency, formatDate } from '@/lib/format'
import { paymentMethodShortLabels } from '@/lib/payment-methods'
import { formatBrPhone } from '@/lib/phone'
import { getOrder } from '@/lib/store'

export const metadata: Metadata = { title: 'Imprimir pedido', robots: { index: false } }

// Comanda para impressora térmica (58 ou 80 mm). Fica fora do layout do painel
// para sair só o papel; abre a impressão sozinha.
export default async function PrintOrderPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ papel?: string; vias?: string }>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!user.admin) notFound()

  const [{ id }, query, branding] = await Promise.all([params, searchParams, getTenantBranding()])
  const order = await getOrder(id)
  if (!order) notFound()

  const paper = query.papel === '58' ? 58 : 80
  const copies = query.vias === '2' ? 2 : 1

  const receipt = (
    <>
      <header>
        <strong className="receipt-brand">{branding.brandName}</strong>
        <span className="receipt-number">PEDIDO #{order.id.slice(-8).toUpperCase()}</span>
        <span>{formatDate(order.createdAt)}</span>
      </header>

      <section>
        <strong>{order.customer.name}</strong>
        {order.customer.phone && <span>{formatBrPhone(order.customer.phone)}</span>}
      </section>

      <ul className="receipt-items">
        {order.products.map(item => (
          <li key={item.id}>
            <div className="receipt-row">
              <strong>
                {item.quantity}x {item.name}
              </strong>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
            {item.details && <span className="receipt-details">{item.details}</span>}
            {item.note && <strong className="receipt-note">OBS: {item.note}</strong>}
          </li>
        ))}
      </ul>

      <section>
        <div className="receipt-row">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="receipt-row">
          <span>Entrega</span>
          <span>{formatCurrency(order.deliveryFee)}</span>
        </div>
        <div className="receipt-row receipt-total">
          <strong>TOTAL</strong>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
      </section>

      <section>
        <strong>Pagamento: {paymentMethodShortLabels[order.paymentMethod]}</strong>
        {order.paymentMethod !== 'online' && (
          <strong>COBRAR NA ENTREGA: {formatCurrency(order.total)}</strong>
        )}
        {order.changeFor !== null && (
          <span>
            Troco para {formatCurrency(order.changeFor)} (levar{' '}
            {formatCurrency(order.changeFor - order.total)})
          </span>
        )}
      </section>
    </>
  )

  return (
    <main className={`receipt-page receipt-${paper}`}>
      <style>{`@page { size: ${paper}mm auto; margin: 0; }`}</style>
      {Array.from({ length: copies }, (_, copy) => (
        <article className="receipt" key={copy}>
          {copies > 1 && <span className="receipt-copy">{copy === 0 ? 'VIA COZINHA' : 'VIA ENTREGA'}</span>}
          {receipt}
        </article>
      ))}
      <AutoPrint />
    </main>
  )
}
