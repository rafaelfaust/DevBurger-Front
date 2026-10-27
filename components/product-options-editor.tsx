'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { emptyOptions, LIMITS, type OptionGroup, type ProductOptions } from '@/lib/product-options'

// No formulário os preços são texto (o lojista digita "4,50"); viram centavos ao salvar.
type EditItem = { id: string; name: string; price: string }
type EditGroup = { id: string; name: string; min: string; max: string; items: EditItem[] }

const newId = () => Math.random().toString(36).slice(2, 10)
const toText = (cents: number) => (cents ? String(cents / 100).replace('.', ',') : '')
const toCents = (text: string) => {
  const value = Number(text.trim().replace(',', '.'))
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0
}
const toInt = (text: string, fallback: number) => {
  const value = Number(text)
  return Number.isInteger(value) ? value : fallback
}

const editItem = (item: { id: string; name: string; priceCents: number }): EditItem => ({
  id: item.id,
  name: item.name,
  price: toText(item.priceCents)
})

function serialize(sizes: EditItem[], maxFlavors: number, groups: EditGroup[]): ProductOptions {
  const item = (entry: EditItem) => ({ id: entry.id, name: entry.name.trim(), priceCents: toCents(entry.price) })
  return {
    sizes: sizes.map(item),
    maxFlavors,
    groups: groups.map(
      (group): OptionGroup => ({
        id: group.id,
        name: group.name.trim(),
        min: toInt(group.min, 0),
        max: toInt(group.max, 1),
        items: group.items.map(item)
      })
    )
  }
}

export function ProductOptionsEditor({
  initial = emptyOptions,
  onSizesChange
}: {
  initial?: ProductOptions
  // Com tamanhos o campo de preço do produto some (vale o preço de cada tamanho).
  onSizesChange: (hasSizes: boolean) => void
}) {
  const [sizes, setSizes] = useState<EditItem[]>(initial.sizes.map(editItem))
  const [maxFlavors, setMaxFlavors] = useState(initial.maxFlavors)
  const [groups, setGroups] = useState<EditGroup[]>(
    initial.groups.map(group => ({
      id: group.id,
      name: group.name,
      min: String(group.min),
      max: String(group.max),
      items: group.items.map(editItem)
    }))
  )

  function changeSizes(next: EditItem[]) {
    setSizes(next)
    onSizesChange(next.length > 0)
  }

  const updateGroup = (id: string, change: (group: EditGroup) => EditGroup) =>
    setGroups(current => current.map(group => (group.id === id ? change(group) : group)))

  return (
    <fieldset className="settings-group options-editor">
      <legend>Tamanhos, sabores e adicionais (opcional)</legend>
      <input name="options" type="hidden" value={JSON.stringify(serialize(sizes, maxFlavors, groups))} />

      <details className="options-help">
        <summary>Como usar</summary>
        <ul>
          <li>
            <strong>Tamanhos:</strong> cada tamanho tem o próprio preço (ex.: Média R$ 45, Grande R$ 55). O
            cliente escolhe um, e o cardápio mostra &quot;a partir de&quot; o menor preço.
          </li>
          <li>
            <strong>Vários sabores (meio a meio):</strong> escolha até quantos sabores o item aceita. Marque a
            mesma opção em todos os sabores da mesma categoria: o cliente só combina produtos que também
            aceitam. Os tamanhos precisam ter o mesmo nome em todos (ex.: &quot;Grande&quot; em todas as
            pizzas). Como cobrar (sabor mais caro ou média) fica em Configurações.
          </li>
          <li>
            <strong>Grupos de opções:</strong> servem para adicionais e escolhas. Exemplos: &quot;Adicionais&quot;
            com mínimo 0 e máximo 5 (Bacon + R$ 4, Cheddar + R$ 3), &quot;Ponto da carne&quot; com mínimo 1 e
            máximo 1 (Mal passada, Ao ponto, Bem passada, sem preço), ou &quot;Borda&quot; com mínimo 0 e
            máximo 1. Mínimo 1 torna a escolha obrigatória.
          </li>
          <li>Todo produto já tem o campo &quot;Alguma observação?&quot; para o cliente (ex.: sem cebola).</li>
        </ul>
      </details>

      <div className="options-block">
        <h3>Tamanhos</h3>
        {sizes.map((size, index) => (
          <div className="option-row" key={size.id}>
            <input
              aria-label="Nome do tamanho"
              maxLength={LIMITS.name}
              onChange={event =>
                changeSizes(sizes.map(item => (item.id === size.id ? { ...item, name: event.target.value } : item)))
              }
              placeholder={['Pequena', 'Média', 'Grande', 'Família'][index] ?? 'Tamanho'}
              value={size.name}
            />
            <input
              aria-label="Preço do tamanho"
              inputMode="decimal"
              onChange={event =>
                changeSizes(sizes.map(item => (item.id === size.id ? { ...item, price: event.target.value } : item)))
              }
              placeholder="R$"
              value={size.price}
            />
            <button
              aria-label="Remover tamanho"
              className="remove-button"
              onClick={() => changeSizes(sizes.filter(item => item.id !== size.id))}
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        {sizes.length < LIMITS.sizes && (
          <button
            className="text-button"
            onClick={() => changeSizes([...sizes, { id: newId(), name: '', price: '' }])}
            type="button"
          >
            <Plus size={15} /> Adicionar tamanho
          </button>
        )}
      </div>

      <div className="options-block">
        <h3>Sabores por item</h3>
        <select
          aria-label="Sabores por item"
          onChange={event => setMaxFlavors(Number(event.target.value))}
          value={maxFlavors}
        >
          <option value={1}>Só um sabor</option>
          <option value={2}>Até 2 sabores (meio a meio)</option>
          <option value={3}>Até 3 sabores</option>
          <option value={4}>Até 4 sabores</option>
        </select>
      </div>

      <div className="options-block">
        <h3>Grupos de opções</h3>
        {groups.map(group => (
          <div className="option-group" key={group.id}>
            <div className="option-row option-group-head">
              <input
                aria-label="Nome do grupo"
                maxLength={LIMITS.name}
                onChange={event => updateGroup(group.id, current => ({ ...current, name: event.target.value }))}
                placeholder="Ex.: Adicionais, Ponto da carne, Borda"
                value={group.name}
              />
              <label>
                Mínimo
                <input
                  inputMode="numeric"
                  onChange={event => updateGroup(group.id, current => ({ ...current, min: event.target.value }))}
                  value={group.min}
                />
              </label>
              <label>
                Máximo
                <input
                  inputMode="numeric"
                  onChange={event => updateGroup(group.id, current => ({ ...current, max: event.target.value }))}
                  value={group.max}
                />
              </label>
              <button
                aria-label="Remover grupo"
                className="remove-button"
                onClick={() => setGroups(current => current.filter(item => item.id !== group.id))}
                type="button"
              >
                <Trash2 size={17} />
              </button>
            </div>
            {group.items.map(item => (
              <div className="option-row" key={item.id}>
                <input
                  aria-label="Nome da opção"
                  maxLength={LIMITS.name}
                  onChange={event =>
                    updateGroup(group.id, current => ({
                      ...current,
                      items: current.items.map(entry =>
                        entry.id === item.id ? { ...entry, name: event.target.value } : entry
                      )
                    }))
                  }
                  placeholder="Ex.: Bacon"
                  value={item.name}
                />
                <input
                  aria-label="Preço extra"
                  inputMode="decimal"
                  onChange={event =>
                    updateGroup(group.id, current => ({
                      ...current,
                      items: current.items.map(entry =>
                        entry.id === item.id ? { ...entry, price: event.target.value } : entry
                      )
                    }))
                  }
                  placeholder="+ R$ (vazio = grátis)"
                  value={item.price}
                />
                <button
                  aria-label="Remover opção"
                  className="remove-button"
                  onClick={() =>
                    updateGroup(group.id, current => ({
                      ...current,
                      items: current.items.filter(entry => entry.id !== item.id)
                    }))
                  }
                  type="button"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            {group.items.length < LIMITS.itemsPerGroup && (
              <button
                className="text-button"
                onClick={() =>
                  updateGroup(group.id, current => ({
                    ...current,
                    items: [...current.items, { id: newId(), name: '', price: '' }]
                  }))
                }
                type="button"
              >
                <Plus size={15} /> Adicionar opção
              </button>
            )}
          </div>
        ))}
        {groups.length < LIMITS.groups && (
          <button
            className="text-button"
            onClick={() =>
              setGroups(current => [
                ...current,
                { id: newId(), name: '', min: '0', max: '1', items: [{ id: newId(), name: '', price: '' }] }
              ])
            }
            type="button"
          >
            <Plus size={15} /> Adicionar grupo
          </button>
        )}
      </div>
    </fieldset>
  )
}
