import type { OrderStatus } from '@/lib/order-status'
import type { PaymentMethod } from '@/lib/payment-methods'

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
  category?: Category | string
}

export type CartItem = Product & {
  quantity: number
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
