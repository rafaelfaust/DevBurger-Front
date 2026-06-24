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
  category?: Category | string
}

export type CartItem = Product & {
  quantity: number
}

export type User = {
  id?: string | number
  name: string
  email: string
  admin?: boolean
}

export type Order = {
  _id: string
  status: string
  createdAt: string
  user: Pick<User, 'name' | 'email'>
  products: Array<
    Product & {
      quantity: number
    }
  >
}
