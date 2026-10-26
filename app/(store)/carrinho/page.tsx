import type { Metadata } from 'next'

import { CartView } from '@/components/cart-view'
import { enabledPaymentMethods } from '@/lib/payment-methods'
import { getCurrentStoreStatus, getStoreSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Carrinho' }

export default async function CartPage() {
  const [settings, status] = await Promise.all([
    getStoreSettings(),
    getCurrentStoreStatus()
  ])

  return (
    <main className="section cart-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Quase lá</p>
          <h1>Seu pedido</h1>
        </div>
      </div>
      <CartView
        deliveryFee={settings.deliveryFee}
        paymentMethods={enabledPaymentMethods(settings)}
        status={status}
      />
    </main>
  )
}
