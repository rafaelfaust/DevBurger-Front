export const paymentMethods = [
  'online',
  'cash',
  'card_on_delivery',
  'pix_on_delivery'
] as const

export type PaymentMethod = (typeof paymentMethods)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  online: 'Pagar agora pelo Mercado Pago',
  cash: 'Dinheiro na entrega',
  card_on_delivery: 'Cartão na entrega (maquininha)',
  pix_on_delivery: 'PIX na entrega'
}

// Rótulo curto para o painel de pedidos.
export const paymentMethodShortLabels: Record<PaymentMethod, string> = {
  online: 'Pago online',
  cash: 'Dinheiro',
  card_on_delivery: 'Cartão na entrega',
  pix_on_delivery: 'PIX na entrega'
}

export type StoreSettings = {
  deliveryFee: number
  acceptsCash: boolean
  acceptsCardOnDelivery: boolean
  acceptsPixOnDelivery: boolean
  acceptsOnline: boolean
  // Se a plataforma tem como processar pagamento online agora.
  onlineAvailable: boolean
}

export function enabledPaymentMethods(settings: StoreSettings): PaymentMethod[] {
  return paymentMethods.filter(method => {
    switch (method) {
      case 'online':
        return settings.acceptsOnline && settings.onlineAvailable
      case 'cash':
        return settings.acceptsCash
      case 'card_on_delivery':
        return settings.acceptsCardOnDelivery
      case 'pix_on_delivery':
        return settings.acceptsPixOnDelivery
    }
  })
}
