import type { OrderStatus } from '@/lib/order-status'
import type { PaymentMethod } from '@/lib/payment-methods'
import type { ItemSelection, ProductOptions } from '@/lib/product-options'

export type Category = {
  id: number
  name: string
  url?: string
}

export type Product = {
  id: number
  name: string
  price: number
  url: string
  offer?: boolean
  category_id: number
  description?: string
  // Só existe com o controle de estoque da loja ligado e o produto com estoque definido.
  stockLeft?: number
  // Tamanhos, sabores e adicionais (vazio = produto simples).
  options?: ProductOptions
  category?: Category | string
}

// Uma linha do carrinho: o mesmo produto com escolhas diferentes vira linhas separadas.
export type CartItem = {
  key: string
  // id do produto
  id: number
  name: string
  url: string
  // Preço unitário já com tamanho, sabores e adicionais (o servidor recalcula).
  price: number
  quantity: number
  details?: string | null
  selection?: ItemSelection
  stockLeft?: number
}

export type UserRole = 'owner' | 'staff' | 'customer'

export type User = {
  id: string
  name: string
  // Cliente que pediu sem cadastro não tem e-mail.
  email: string | null
  phone: string | null
  role: UserRole
  admin: boolean
}

export type OrderItem = {
  id: number
  name: string
  price: number
  quantity: number
  details: string | null
  note: string | null
}

export type Order = {
  id: string
  status: OrderStatus
  createdAt: string
  customer: { name: string; phone: string | null; email: string | null }
  whatsappOptIn: boolean
  products: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  changeFor: number | null
  // Mensagem da etapa atual (botão manual "Avisar no WhatsApp"); null se a etapa não avisa.
  whatsappText: string | null
}
