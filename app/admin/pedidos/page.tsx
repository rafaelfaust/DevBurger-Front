import { OrderStatus } from '@/components/order-status'
import { getOrders } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'

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
          <article className="order-card" key={order._id}>
            <div className="order-card-head">
              <div>
                <strong>#{order._id.slice(-8)}</strong>
                <span>{order.user.name}</span>
                <small>{formatDate(order.createdAt)}</small>
              </div>
              <OrderStatus
                initialStatus={order.status}
                orderId={order._id}
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
            </ul>
          </article>
        ))}
        {!orders.length && <p>Nenhum pedido encontrado.</p>}
      </div>
    </>
  )
}
