import { OrderStatus } from '@/components/order-status'
import { formatCurrency, formatDate } from '@/lib/format'
import { paymentMethodShortLabels } from '@/lib/payment-methods'
import { formatBrPhone, whatsappLink } from '@/lib/phone'
import { getOrders } from '@/lib/store'

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
                  <a
                    className="customer-phone"
                    href={whatsappLink(order.customer.phone)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {formatBrPhone(order.customer.phone)} · abrir WhatsApp
                  </a>
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
