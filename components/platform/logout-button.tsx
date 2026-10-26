'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PlatformLogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/platform/logout', { method: 'POST' })
    router.replace('/plataforma/login')
    router.refresh()
  }

  return (
    <button className="text-button" onClick={logout} type="button">
      <LogOut size={15} /> Sair
    </button>
  )
}
