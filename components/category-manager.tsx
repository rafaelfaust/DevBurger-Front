'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import type { AdminCategory } from '@/lib/store'

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  async function send(url: string, method: string, body: unknown, success: string) {
    setBusy(true)
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      if (success) toast.success(success)
      router.refresh()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const name = String(new FormData(formElement).get('name') ?? '')
    if (await send('/api/admin/categories', 'POST', { name }, 'Categoria criada')) formElement.reset()
  }

  async function rename(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name') ?? '')
    if (await send(`/api/admin/categories/${id}`, 'PATCH', { name }, 'Categoria renomeada')) setEditingId(null)
  }

  return (
    <div className="admin-form category-manager">
      <ul className="category-list">
        {categories.map((category, index) => (
          <li key={category.id}>
            <div className="category-order">
              <button
                aria-label={`Subir ${category.name}`}
                className="icon-button"
                disabled={busy || index === 0}
                onClick={() => send(`/api/admin/categories/${category.id}`, 'PATCH', { move: 'up' }, '')}
                type="button"
              >
                <ArrowUp size={16} />
              </button>
              <button
                aria-label={`Descer ${category.name}`}
                className="icon-button"
                disabled={busy || index === categories.length - 1}
                onClick={() => send(`/api/admin/categories/${category.id}`, 'PATCH', { move: 'down' }, '')}
                type="button"
              >
                <ArrowDown size={16} />
              </button>
            </div>

            {editingId === category.id ? (
              <form className="inline-form category-rename" onSubmit={event => rename(event, category.id)}>
                <label className="sr-only" htmlFor={`category-${category.id}`}>
                  Nome da categoria
                </label>
                <input autoFocus defaultValue={category.name} id={`category-${category.id}`} maxLength={40} name="name" required />
                <button className="button" disabled={busy}>
                  Salvar
                </button>
                <button className="text-button" onClick={() => setEditingId(null)} type="button">
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="category-name">
                <strong>{category.name}</strong>
                <span className="settings-hint">
                  {category.products} {category.products === 1 ? 'produto' : 'produtos'}
                </span>
              </div>
            )}

            {editingId !== category.id && (
              <div className="row-actions">
                {confirmingId === category.id ? (
                  <>
                    <span>Excluir?</span>
                    <button
                      className="text-button danger"
                      disabled={busy}
                      onClick={() =>
                        send(`/api/admin/categories/${category.id}`, 'DELETE', undefined, 'Categoria excluída').then(() =>
                          setConfirmingId(null)
                        )
                      }
                      type="button"
                    >
                      Sim
                    </button>
                    <button className="text-button" onClick={() => setConfirmingId(null)} type="button">
                      Não
                    </button>
                  </>
                ) : (
                  <>
                    <button className="text-button" onClick={() => setEditingId(category.id)} type="button">
                      Renomear
                    </button>
                    <button
                      className="text-button danger"
                      disabled={category.products > 0}
                      onClick={() => setConfirmingId(category.id)}
                      title={category.products > 0 ? 'Mova ou exclua os produtos desta categoria antes' : undefined}
                      type="button"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {!categories.length && <p className="settings-hint">Nenhuma categoria ainda.</p>}

      <form className="inline-form" onSubmit={create}>
        <label className="sr-only" htmlFor="new-category">
          Nova categoria
        </label>
        <input id="new-category" maxLength={40} name="name" placeholder="Nova categoria (ex.: Sobremesas)" required />
        <button className="button" disabled={busy}>
          Adicionar
        </button>
      </form>
    </div>
  )
}
