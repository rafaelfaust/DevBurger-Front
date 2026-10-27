// Tamanhos, vários sabores (meio a meio) e adicionais de um produto.
// Usado igual na loja (prévia do preço) e no servidor (preço que vale).

// Valores sempre em centavos.
export type OptionItem = { id: string; name: string; priceCents: number }

// Ex.: "Adicionais" (min 0, max 5) ou "Ponto da carne" (min 1, max 1).
export type OptionGroup = {
  id: string
  name: string
  min: number
  max: number
  items: OptionItem[]
}

export type ProductOptions = {
  // Com tamanhos, o preço do produto é o do tamanho escolhido.
  sizes: OptionItem[]
  // 1 = sabor único; 2 = meio a meio; até 4 sabores.
  maxFlavors: number
  groups: OptionGroup[]
}

export const emptyOptions: ProductOptions = { sizes: [], maxFlavors: 1, groups: [] }

export const LIMITS = {
  sizes: 8,
  flavors: 4,
  groups: 10,
  itemsPerGroup: 30,
  name: 40,
  note: 140
} as const

// Como cobrar um item com vários sabores.
export const halfPricingRules = ['highest', 'average'] as const
export type HalfPricing = (typeof halfPricingRules)[number]

export const halfPricingLabels: Record<HalfPricing, string> = {
  highest: 'Pelo sabor mais caro',
  average: 'Pela média dos sabores'
}

// O que o cliente escolheu para um item do carrinho.
export type ItemSelection = {
  // id do tamanho do produto
  size?: string
  // Outros sabores (ids de produtos), além do próprio produto.
  flavors?: number[]
  // ids dos itens escolhidos nos grupos
  options?: string[]
  note?: string
}

export function hasChoices(options: ProductOptions | undefined) {
  return Boolean(options && (options.sizes.length || options.groups.length || options.maxFlavors > 1))
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// Preço de um sabor no tamanho escolhido (pelo nome: "Grande" de um sabor vale para o outro).
// null = o sabor não tem esse tamanho.
export function flavorPriceCents(
  flavor: { priceCents: number; options: ProductOptions },
  sizeName: string | null
): number | null {
  if (!sizeName) return flavor.options.sizes.length ? null : flavor.priceCents
  const size = flavor.options.sizes.find(item => sameName(item.name, sizeName))
  return size ? size.priceCents : null
}

export function combineFlavors(prices: number[], rule: HalfPricing) {
  if (rule === 'average') return Math.ceil(prices.reduce((sum, price) => sum + price, 0) / prices.length)
  return Math.max(...prices)
}

const fraction = (count: number) => (count === 2 ? '1/2' : `1/${count}`)

// Texto curto do item para pedido, impressão e WhatsApp:
// "Grande · 1/2 Calabresa, 1/2 Frango · + Bacon, Ao ponto"
export function describeSelection(parts: {
  size: string | null
  flavors: string[]
  options: string[]
}) {
  const pieces = [
    parts.size,
    parts.flavors.length > 1 ? parts.flavors.map(name => `${fraction(parts.flavors.length)} ${name}`).join(', ') : null,
    parts.options.length ? parts.options.join(', ') : null
  ]
  return pieces.filter(Boolean).join(' · ') || null
}

type PricedProduct = { id: number; name: string; priceCents: number; options: ProductOptions }

// Confere a escolha e calcula o preço unitário. Lança SelectionError com a mensagem para o cliente.
export class SelectionError extends Error {}

export function priceSelection(
  product: PricedProduct,
  selection: ItemSelection,
  findFlavor: (id: number) => PricedProduct | undefined,
  rule: HalfPricing
) {
  const { sizes, maxFlavors, groups } = product.options

  let size: OptionItem | null = null
  if (sizes.length) {
    size = sizes.find(item => item.id === selection.size) ?? null
    if (!size) throw new SelectionError(`Escolha o tamanho de ${product.name}`)
  }

  const extraIds = [...new Set(selection.flavors ?? [])].filter(id => id !== product.id)
  if (extraIds.length > maxFlavors - 1) {
    throw new SelectionError(`${product.name} aceita até ${maxFlavors} sabor(es)`)
  }
  const flavors = [product, ...extraIds.map(id => {
    const flavor = findFlavor(id)
    if (!flavor) throw new SelectionError(`Um dos sabores de ${product.name} não está mais disponível`)
    return flavor
  })]
  const prices = flavors.map(flavor => {
    const price = flavorPriceCents(flavor, size?.name ?? null)
    if (price === null) throw new SelectionError(`${flavor.name} não tem o tamanho ${size?.name}`)
    return price
  })

  const chosen = new Set(selection.options ?? [])
  const picked: OptionItem[] = []
  for (const group of groups) {
    const inGroup = group.items.filter(item => chosen.has(item.id))
    if (inGroup.length < group.min) {
      throw new SelectionError(
        group.min === 1 ? `Escolha ${group.name.toLowerCase()}` : `Escolha pelo menos ${group.min} em ${group.name}`
      )
    }
    if (inGroup.length > group.max) {
      throw new SelectionError(`Escolha no máximo ${group.max} em ${group.name}`)
    }
    picked.push(...inGroup)
  }
  const known = new Set(groups.flatMap(group => group.items.map(item => item.id)))
  if ([...chosen].some(id => !known.has(id))) {
    throw new SelectionError(`Uma opção de ${product.name} mudou`)
  }

  const unitCents = combineFlavors(prices, rule) + picked.reduce((sum, item) => sum + item.priceCents, 0)
  return {
    unitCents,
    details: describeSelection({
      size: size?.name ?? null,
      flavors: flavors.map(flavor => flavor.name),
      options: picked.map(item => (item.priceCents > 0 ? `+ ${item.name}` : item.name))
    }),
    note: selection.note?.trim().slice(0, LIMITS.note) || null
  }
}
