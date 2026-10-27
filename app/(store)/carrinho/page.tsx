import type { Metadata } from 'next'

import { CartView } from '@/components/cart-view'
import { getSessionUser } from '@/lib/auth'
import { enabledPaymentMethods } from '@/lib/payment-methods'
import { formatBrPhone } from '@/lib/phone'
import { getCurrentStoreStatus, getStoreSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Carrinho' }

export default async function CartPage() {
  const [settings, status, user] = await Promise.all([
    getStoreSettings(),
    getCurrentStoreStatus(),
    getSessionUser()
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
        prefill={user ? { name: user.name, phone: user.phone ? formatBrPhone(user.phone) : '' } : null}
        status={status}
      />
    </main>
  )
}
