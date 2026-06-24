'use client'

import { LogOut, Menu, ShoppingBag, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useCart } from '@/components/cart-context'
import type { Branding } from '@/lib/branding'
import type { User } from '@/lib/types'

export function Header({
  user,
  branding
}: {
  user: User | null
  branding: Branding
}) {
  const [open, setOpen] = useState(false)
  const { count } = useCart()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span>{branding.brandWordmarkLead}</span>
        {branding.brandWordmarkTrail ? ` ${branding.brandWordmarkTrail}` : ''}
      </Link>
      <button
        aria-label="Abrir menu"
        className="mobile-menu"
        onClick={() => setOpen(value => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? 'nav open' : 'nav'}>
        <Link href="/">Início</Link>
        <Link href="/produtos">Cardápio</Link>
        {user?.admin && <Link href="/admin/pedidos">Administração</Link>}
      </nav>
      <div className="header-actions">
        <Link aria-label="Carrinho" className="cart-link" href="/carrinho">
          <ShoppingBag />
          {count > 0 && <span>{count}</span>}
        </Link>
        {user ? (
          <>
            <span className="user-name">
              <UserRound size={18} /> {user.name.split(' ')[0]}
            </span>
            <button aria-label="Sair" className="icon-button" onClick={logout}>
              <LogOut size={19} />
            </button>
          </>
        ) : (
          <Link className="button small" href="/login">
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
