'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form)

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      toast.success(mode === 'login' ? 'Bem-vindo!' : 'Conta criada com sucesso')
      router.push(mode === 'login' ? (data.user?.admin ? '/admin/pedidos' : '/') : '/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível continuar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === 'register' && (
        <label>
          Nome
          <input autoComplete="name" minLength={2} name="name" required />
        </label>
      )}
      <label>
        E-mail
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        Senha
        <input
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={6}
          name="password"
          required
          type="password"
        />
      </label>
      <button className="button" disabled={loading}>
        {loading
          ? 'Aguarde...'
          : mode === 'login'
            ? 'Entrar'
            : 'Criar minha conta'}
      </button>
      <p>
        {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}{' '}
        <Link href={mode === 'login' ? '/cadastro' : '/login'}>
          {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
        </Link>
      </p>
    </form>
  )
}
