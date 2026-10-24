export const orderStatuses = [
  'awaiting_payment',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'canceled'
] as const

export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  awaiting_payment: 'Aguardando pagamento',
  confirmed: 'Pedido confirmado',
  preparing: 'Em preparação',
  ready: 'Pronto',
  out_for_delivery: 'A caminho',
  delivered: 'Entregue',
  canceled: 'Cancelado'
}

// Para onde a loja pode mover um pedido a partir de cada status.
// A saída de awaiting_payment para confirmed é feita pelo pagamento.
export const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ['canceled'],
  confirmed: ['preparing', 'canceled'],
  preparing: ['ready', 'canceled'],
  ready: ['out_for_delivery', 'delivered', 'canceled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  canceled: []
}
