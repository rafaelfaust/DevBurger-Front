import type { Metadata } from 'next'

import { CartView } from '@/components/cart-view'

export const metadata: Metadata = { title: 'Carrinho' }

export default function CartPage() {
  return (
    <main className="section cart-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quase lá</p>
          <h1>Seu pedido</h1>
        </div>
      </div>
      <CartView />
    </main>
  )
}
