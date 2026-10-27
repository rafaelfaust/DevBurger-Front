'use client'

import { Minus, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/cart-context'
import { formatCurrency } from '@/lib/format'
import {
  emptyOptions,
  flavorPriceCents,
  halfPricingLabels,
  LIMITS,
  priceSelection,
  SelectionError,
  type HalfPricing,
  type ItemSelection,
  type OptionGroup
} from '@/lib/product-options'
import type { Product } from '@/lib/types'

export type Menu = { products: Product[]; halfPricing: HalfPricing }

const priced = (product: Product) => ({
  id: product.id,
  name: product.name,
  priceCents: Math.round(product.price * 100),
  options: product.options ?? emptyOptions
})

function groupHint(group: OptionGroup) {
  if (group.min > 0 && group.min === group.max) return group.min === 1 ? 'Obrigatório' : `Escolha ${group.min}`
  if (group.min > 0) return `Escolha de ${group.min} a ${group.max}`
  return group.max === 1 ? 'Opcional' : `Opcional · até ${group.max}`
}

export function ProductDialog({
  product,
  menu,
  inCart,
  onClose
}: {
  product: Product
  menu: Menu
  // Unidades deste produto já no carrinho (para o limite de estoque).
  inCart: number
  onClose: () => void
}) {
  const { add } = useCart()
  const options = product.options ?? emptyOptions
  const [size, setSize] = useState<string | undefined>(options.sizes[0]?.id)
  const [flavors, setFlavors] = useState<number[]>([])
  const [chosen, setChosen] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState(1)

  const sizeName = options.sizes.find(item => item.id === size)?.name ?? null
  // Outros sabores: mesma categoria, também aceitam vários sabores e têm o tamanho escolhido.
  const flavorPool =
    options.maxFlavors > 1
      ? menu.products.filter(
          candidate =>
            candidate.id !== product.id &&
            candidate.category_id === product.category_id &&
            (candidate.options?.maxFlavors ?? 1) > 1 &&
            candidate.stockLeft !== 0 &&
            flavorPriceCents(priced(candidate), sizeName) !== null
        )
      : []
  const activeFlavors = flavors.filter(id => flavorPool.some(candidate => candidate.id === id))

  const selection: ItemSelection = {
    ...(size && { size }),
    ...(activeFlavors.length && { flavors: activeFlavors }),
    ...(chosen.length && { options: chosen }),
    ...(note.trim() && { note: note.trim() })
  }

  let result: ReturnType<typeof priceSelection> | null = null
  let problem: string | null = null
  try {
    result = priceSelection(
      priced(product),
      selection,
      id => {
        const flavor = flavorPool.find(candidate => candidate.id === id)
        return flavor && priced(flavor)
      },
      menu.halfPricing
    )
  } catch (error) {
    problem = error instanceof SelectionError ? error.message : 'Revise as escolhas'
  }

  function toggleFlavor(id: number) {
    setFlavors(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : activeFlavors.length < options.maxFlavors - 1
          ? [...current.filter(item => activeFlavors.includes(item)), id]
          : current
    )
  }

  function toggleOption(group: OptionGroup, id: string) {
    setChosen(current => {
      if (current.includes(id)) return current.filter(item => item !== id)
      const inGroup = group.items.filter(item => current.includes(item.id)).map(item => item.id)
      // Grupo de uma escolha troca a opção; os outros param no máximo.
      if (group.max === 1) return [...current.filter(item => !inGroup.includes(item)), id]
      return inGroup.length < group.max ? [...current, id] : current
    })
  }

  function addToCart() {
    if (!result) return
    if (product.stockLeft !== undefined && inCart + quantity > product.stockLeft) {
      toast.error(`Só restam ${product.stockLeft} unidade(s) de ${product.name}`)
      return
    }
    add(
      {
        id: product.id,
        name: product.name,
        url: product.url,
        price: result.unitCents / 100,
        details: result.details,
        selection,
        stockLeft: product.stockLeft
      },
      quantity
    )
    toast.success(`${product.name} adicionado ao carrinho`)
    onClose()
  }

  return (
    <dialog
      aria-label={product.name}
      className="product-dialog"
      onClick={event => event.target === event.currentTarget && onClose()}
      onClose={onClose}
      ref={element => {
        if (element && !element.open) element.showModal()
      }}
    >
      <div className="product-dialog-body">
        <button aria-label="Fechar" className="dialog-close" onClick={onClose} type="button">
          <X size={20} />
        </button>
        <div className="product-dialog-image">
          <Image alt={product.name} fill sizes="(max-width: 600px) 100vw, 560px" src={product.url} />
        </div>
        <div className="product-dialog-content">
          <h2>{product.name}</h2>
          {product.description && <p className="product-description">{product.description}</p>}

          {options.sizes.length > 0 && (
            <fieldset className="choice-group">
              <legend>
                Tamanho <span className="choice-hint">Obrigatório</span>
              </legend>
              {options.sizes.map(item => (
                <label className="choice" key={item.id}>
                  <input
                    checked={size === item.id}
                    name="size"
                    onChange={() => setSize(item.id)}
                    type="radio"
                  />
                  <span>{item.name}</span>
                  <strong>{formatCurrency(item.priceCents / 100)}</strong>
                </label>
              ))}
            </fieldset>
          )}

          {options.maxFlavors > 1 && (
            <fieldset className="choice-group">
              <legend>
                Sabores <span className="choice-hint">Até {options.maxFlavors} · {halfPricingLabels[menu.halfPricing].toLowerCase()}</span>
              </legend>
              <label className="choice">
                <input checked disabled type="checkbox" />
                <span>{product.name}</span>
              </label>
              {flavorPool.map(candidate => {
                const checked = activeFlavors.includes(candidate.id)
                const price = flavorPriceCents(priced(candidate), sizeName)
                return (
                  <label className="choice" key={candidate.id}>
                    <input
                      checked={checked}
                      disabled={!checked && activeFlavors.length >= options.maxFlavors - 1}
                      onChange={() => toggleFlavor(candidate.id)}
                      type="checkbox"
                    />
                    <span>{candidate.name}</span>
                    {price !== null && <small>{formatCurrency(price / 100)}</small>}
                  </label>
                )
              })}
              {!flavorPool.length && <p className="choice-hint">Nenhum outro sabor disponível agora.</p>}
            </fieldset>
          )}

          {options.groups.map(group => (
            <fieldset className="choice-group" key={group.id}>
              <legend>
                {group.name} <span className="choice-hint">{groupHint(group)}</span>
              </legend>
              {group.items.map(item => (
                <label className="choice" key={item.id}>
                  <input
                    checked={chosen.includes(item.id)}
                    onChange={() => toggleOption(group, item.id)}
                    // Rádio só quando é obrigatório escolher exatamente um (não dá para desmarcar).
                    type={group.min === 1 && group.max === 1 ? 'radio' : 'checkbox'}
                  />
                  <span>{item.name}</span>
                  {item.priceCents > 0 && <strong>+ {formatCurrency(item.priceCents / 100)}</strong>}
                </label>
              ))}
            </fieldset>
          ))}

          <label className="choice-note" htmlFor={`note-${product.id}`}>
            Alguma observação?
            <textarea
              id={`note-${product.id}`}
              maxLength={LIMITS.note}
              onChange={event => setNote(event.target.value)}
              placeholder="Ex.: sem cebola, molho à parte"
              rows={2}
              value={note}
            />
          </label>
        </div>
        <div className="product-dialog-footer">
          <div className="quantity">
            <button
              aria-label="Diminuir"
              onClick={() => setQuantity(current => Math.max(1, current - 1))}
              type="button"
            >
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button
              aria-label="Aumentar"
              onClick={() => setQuantity(current => Math.min(20, current + 1))}
              type="button"
            >
              <Plus size={16} />
            </button>
          </div>
          <button className="button" disabled={!result} onClick={addToCart} type="button">
            {result ? `Adicionar · ${formatCurrency((result.unitCents * quantity) / 100)}` : problem}
          </button>
        </div>
      </div>
    </dialog>
  )
}
