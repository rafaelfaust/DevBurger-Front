'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { cartStorageKey } from '@/lib/branding'
import type { CartItem, Product } from '@/lib/types'

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (product: Product) => void
  increase: (id: number) => void
  decrease: (id: number) => void
  remove: (id: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(cartStorageKey)
      if (stored) setItems(JSON.parse(stored) as CartItem[])
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(cartStorageKey, JSON.stringify(items))
  }, [hydrated, items])

  const add = useCallback((product: Product) => {
    setItems(current => {
      const exists = current.some(item => item.id === product.id)
      return exists
        ? current.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...current, { ...product, quantity: 1 }]
    })
  }, [])

  const increase = useCallback((id: number) => {
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }, [])

  const decrease = useCallback((id: number) => {
    setItems(current =>
      current.flatMap(item =>
        item.id !== id
          ? [item]
          : item.quantity > 1
            ? [{ ...item, quantity: item.quantity - 1 }]
            : []
      )
    )
  }, [])

  const remove = useCallback(
    (id: number) => setItems(current => current.filter(item => item.id !== id)),
    []
  )
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      total: items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      add,
      increase,
      decrease,
      remove,
      clear
    }),
    [add, clear, decrease, increase, items, remove]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart deve ser usado dentro de CartProvider')
  return context
}
