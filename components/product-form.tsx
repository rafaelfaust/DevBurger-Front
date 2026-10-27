'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import type { AdminProduct } from '@/lib/store'
import type { Category } from '@/lib/types'

export function ProductForm({
  categories,
  product
}: {
  categories: Category[]
  // Com produto = edição; sem = cadastro.
  product?: AdminProduct
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const editing = Boolean(product)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    // currentTarget vira null depois do await.
    const formElement = event.currentTarget
    const form = new FormData(formElement)

    try {
      const response = await fetch(editing ? `/api/admin/products/${product!.id}` : '/api/admin/products', {
        method: editing ? 'PUT' : 'POST',
        body: form
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      if (editing) {
        toast.success('Produto atualizado')
        router.push('/admin/produtos')
        router.refresh()
      } else {
        toast.success('Produto cadastrado')
        formElement.reset()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  if (!categories.length) {
    return (
      <div className="admin-form">
        <p>Crie uma categoria antes de cadastrar produtos.</p>
        <Link className="button" href="/admin/categorias">
          Criar categoria
        </Link>
      </div>
    )
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label htmlFor="product-name">
        Nome
        <input defaultValue={product?.name} id="product-name" maxLength={80} name="name" required />
      </label>
      <label htmlFor="product-description">
        Descrição (opcional)
        <textarea
          defaultValue={product?.description}
          id="product-description"
          maxLength={300}
          name="description"
          placeholder="Ingredientes, tamanho, quantas pessoas serve..."
          rows={3}
        />
      </label>
      <label htmlFor="product-price">
        Preço (R$)
        <input
          defaultValue={product?.price}
          id="product-price"
          min="0.01"
          name="price"
          required
          step="0.01"
          type="number"
        />
      </label>
      <label htmlFor="product-category">
        Categoria
        <select defaultValue={product?.category_id ?? ''} id="product-category" name="category_id" required>
          <option value="">Selecione</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      {product && (
        <div className="current-image">
          <Image alt={product.name} height={90} src={product.url} width={110} />
          <span className="settings-hint">Foto atual. Envie outra abaixo só se quiser trocar.</span>
        </div>
      )}
      <label htmlFor="product-file">
        {editing ? 'Nova foto (opcional)' : 'Foto'} (JPG, PNG ou WebP, até 4 MB)
        <input
          accept="image/jpeg,image/png,image/webp"
          id="product-file"
          name="file"
          required={!editing}
          type="file"
        />
      </label>
      <label className="checkbox" htmlFor="product-offer">
        <input defaultChecked={product?.offer} id="product-offer" name="offer" type="checkbox" value="true" />
        Produto em oferta (aparece nos destaques da página inicial)
      </label>
      <div className="platform-actions">
        <button className="button" disabled={loading}>
          {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
        {editing && (
          <Link className="text-button" href="/admin/produtos">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  )
}
