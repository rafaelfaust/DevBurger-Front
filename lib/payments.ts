// Checkout falso para testes: local ou deploy de preview da Vercel. Nunca em produção.
export const demoCheckout =
  process.env.ALLOW_DEMO_CHECKOUT === 'true' &&
  (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview')

// Por enquanto o pagamento online usa a credencial da plataforma.
// Na fase 3 cada restaurante conecta a própria conta Mercado Pago.
export function isOnlinePaymentAvailable() {
  return demoCheckout || Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN)
}
