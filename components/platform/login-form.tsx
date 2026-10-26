'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

export function PlatformLoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/platform/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      router.replace('/plataforma')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível entrar')
      setLoading(false)
    }
  }

  return (
    <form className="admin-form platform-form" onSubmit={submit}>
      <label htmlFor="platform-email">
        E-mail
        <input autoComplete="username" id="platform-email" name="email" required type="email" />
      </label>
      <label htmlFor="platform-password">
        Senha
        <input
          autoComplete="current-password"
          id="platform-password"
          name="password"
          required
          type="password"
        />
      </label>
      <button className="button" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
