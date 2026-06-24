'use client'

import { Toaster } from 'sonner'

import { CartProvider } from '@/components/cart-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Toaster richColors position="top-right" />
    </CartProvider>
  )
}
