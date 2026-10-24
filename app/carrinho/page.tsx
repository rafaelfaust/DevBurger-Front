import type { Metadata } from 'next'

import { CartView } from '@/components/cart-view'
import { enabledPaymentMethods } from '@/lib/payment-methods'
import { getStoreSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Carrinho' }

export default async function CartPage() {
  const settings = await getStoreSettings()

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
      />
    </main>
  )
}
