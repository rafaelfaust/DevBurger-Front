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
import type { ItemSelection } from '@/lib/product-options'
import type { CartItem } from '@/lib/types'

export type NewCartItem = Omit<CartItem, 'key' | 'quantity'>

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  add: (item: NewCartItem, quantity?: number) => void
  increase: (key: string) => void
  decrease: (key: string) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// Mesmo produto com as mesmas escolhas soma na mesma linha.
const lineKey = (id: number, selection?: ItemSelection) =>
  selection ? `${id}:${JSON.stringify(selection)}` : String(id)

// Carrinhos salvos antes das linhas com escolhas não tinham "key".
function readStoredCart(raw: string): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(item => typeof item?.id === 'number' && typeof item?.quantity === 'number')
      .map(item => ({ ...item, key: item.key ?? lineKey(item.id, item.selection) }))
  } catch {
    // Carrinho salvo ilegível: começa vazio.
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(cartStorageKey)
      if (stored) setItems(readStoredCart(stored))
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(cartStorageKey, JSON.stringify(items))
  }, [hydrated, items])

  const add = useCallback((item: NewCartItem, quantity = 1) => {
    const key = lineKey(item.id, item.selection)
    setItems(current =>
      current.some(line => line.key === key)
        ? current.map(line => (line.key === key ? { ...line, quantity: line.quantity + quantity } : line))
        : [...current, { ...item, key, quantity }]
    )
  }, [])

  const increase = useCallback((key: string) => {
    setItems(current =>
      current.map(item =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }, [])

  const decrease = useCallback((key: string) => {
    setItems(current =>
      current.flatMap(item =>
        item.key !== key
          ? [item]
          : item.quantity > 1
            ? [{ ...item, quantity: item.quantity - 1 }]
            : []
      )
    )
  }, [])

  const remove = useCallback(
    (key: string) => setItems(current => current.filter(item => item.key !== key)),
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
