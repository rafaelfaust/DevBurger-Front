'use client'

import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import type { Category } from '@/lib/types'

export function ProductForm({ categories }: { categories: Category[] }) {
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: form
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success('Produto cadastrado')
      event.currentTarget.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label>
        Nome
        <input name="name" required />
      </label>
      <label>
        Preço
        <input min="0.01" name="price" required step="0.01" type="number" />
      </label>
      <label>
        Categoria
        <select name="category_id" required>
          <option value="">Selecione</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Imagem
        <input accept="image/jpeg,image/png,image/webp" name="file" required type="file" />
      </label>
      <label className="checkbox">
        <input name="offer" type="checkbox" value="true" />
        Produto em oferta
      </label>
      <button className="button" disabled={loading}>
        {loading ? 'Salvando...' : 'Cadastrar produto'}
      </button>
    </form>
  )
}
