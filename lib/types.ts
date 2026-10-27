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
  category?: Category | string
}

export type CartItem = Product & {
  quantity: number
}

export type UserRole = 'owner' | 'staff' | 'customer'

export type User = {
  id: string
  name: string
  email: string
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
  user: Pick<User, 'name' | 'email'>
  products: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: PaymentMethod
  changeFor: number | null
}
