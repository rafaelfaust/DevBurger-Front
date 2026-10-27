import { OrderStatus } from '@/components/order-status'
import { formatCurrency, formatDate } from '@/lib/format'
import { paymentMethodShortLabels } from '@/lib/payment-methods'
import { formatBrPhone, whatsappLink } from '@/lib/phone'
import { getOrders } from '@/lib/store'

// Abrir a lista também envia os avisos de WhatsApp pendentes em segundo plano.
export const maxDuration = 60

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Operação</p>
        <h1>Pedidos</h1>
      </div>
      <div className="orders-list">
        {orders.map(order => (
          <article className="order-card" key={order.id}>
            <div className="order-card-head">
              <div>
                <strong>#{order.id.slice(-8)}</strong>
                <span>{order.customer.name}</span>
                {order.customer.phone && (
                  <span className="customer-contact">
                    <a
                      className="customer-phone"
                      href={whatsappLink(order.customer.phone)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {formatBrPhone(order.customer.phone)}
                    </a>
                    {order.whatsappText && (
                      // Plano B: abre a conversa com a mensagem da etapa atual pronta.
                      <a
                        className="text-button"
                        href={whatsappLink(order.customer.phone, order.whatsappText)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Avisar no WhatsApp
                      </a>
                    )}
                  </span>
                )}
                <small>{formatDate(order.createdAt)}</small>
                <small>
                  {paymentMethodShortLabels[order.paymentMethod]}
                  {order.changeFor !== null &&
                    ` · troco para ${formatCurrency(order.changeFor)} (devolver ${formatCurrency(order.changeFor - order.total)})`}
                </small>
              </div>
              <OrderStatus
                initialStatus={order.status}
                orderId={order.id}
              />
            </div>
            <ul>
              {order.products.map(product => (
                <li key={product.id}>
                  <span>
                    {product.quantity}× {product.name}
                    {product.details && <small className="order-item-details">{product.details}</small>}
                    {product.note && <small className="order-item-note">Obs.: {product.note}</small>}
                  </span>
                  <strong>
                    {formatCurrency(product.price * product.quantity)}
                  </strong>
                </li>
              ))}
              <li>
                <span>Taxa de entrega</span>
                <strong>{formatCurrency(order.deliveryFee)}</strong>
              </li>
              <li>
                <span>Total</span>
                <strong>{formatCurrency(order.total)}</strong>
              </li>
            </ul>
          </article>
        ))}
        {!orders.length && <p>Nenhum pedido encontrado.</p>}
      </div>
    </>
  )
}
