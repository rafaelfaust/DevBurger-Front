import { and, asc, count, desc, eq, gte, inArray, isNotNull, lt, sql } from 'drizzle-orm'
import { after } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth'
import { buildBranding, type BrandingOverrides } from '@/lib/branding'
import { getDb, schema, type Database } from '@/lib/db'
import {
  getStoreStatus,
  type OpeningHours,
  type StatusOverride
} from '@/lib/opening-hours'
import { orderStatusTransitions, type OrderStatus } from '@/lib/order-status'
import { hashPassword } from '@/lib/password'
import { normalizeBrMobile } from '@/lib/phone'
import {
  enabledPaymentMethods,
  type PaymentMethod,
  type StoreSettings
} from '@/lib/payment-methods'
import { isOnlinePaymentAvailable } from '@/lib/payments'
import {
  LIMITS,
  priceSelection,
  SelectionError,
  type HalfPricing,
  type ItemSelection,
  type ProductOptions
} from '@/lib/product-options'
import type { Segment } from '@/lib/segments'
import { uploadImage } from '@/lib/storage'
import { drainOutbox, notifyOrder, orderMessage } from '@/lib/whatsapp/notifications'
import { getCurrentTenant, StoreError, type Tenant } from '@/lib/tenant'
import type { Category, Order, Product, User } from '@/lib/types'

export { StoreError }

const toReais = (cents: number) => cents / 100

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function assertOrderId(id: string) {
  if (!uuidPattern.test(id)) throw new StoreError('Pedido não encontrado', 404)
}

// stockControl = controle de estoque da loja ligado; só então o saldo aparece no cardápio.
function toProduct(row: typeof schema.products.$inferSelect, stockControl = false): Product {
  const limited = stockControl && row.stockQuantity !== null
  return {
    id: row.id,
    name: row.name,
    price: toReais(row.priceCents),
    url: row.imageUrl,
    offer: row.offer,
    category_id: row.categoryId,
    description: row.description ?? undefined,
    options: row.options,
    ...(limited && { stockLeft: Math.max(row.stockQuantity ?? 0, 0) })
  }
}

function toSettings(tenant: Tenant): StoreSettings {
  return {
    deliveryFee: toReais(tenant.deliveryFeeCents),
    acceptsCash: tenant.acceptsCash,
    acceptsCardOnDelivery: tenant.acceptsCardOnDelivery,
    acceptsPixOnDelivery: tenant.acceptsPixOnDelivery,
    acceptsOnline: tenant.acceptsOnline,
    onlineAvailable: isOnlinePaymentAvailable(),
    stockControl: tenant.stockControl,
    pixKey: tenant.pixKey,
    halfPricing: tenant.halfPricing
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return toSettings(await getCurrentTenant())
}

export async function updateStoreSettings(
  input: Omit<StoreSettings, 'onlineAvailable' | 'stockControl' | 'pixKey' | 'halfPricing'> & {
    stockControl?: boolean
    pixKey?: string | null
    halfPricing?: HalfPricing
  }
): Promise<StoreSettings> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()

  const candidate = {
    ...input,
    onlineAvailable: isOnlinePaymentAvailable(),
    stockControl: input.stockControl ?? tenant.stockControl,
    pixKey: input.pixKey ?? tenant.pixKey,
    halfPricing: input.halfPricing ?? tenant.halfPricing
  }
  if (!enabledPaymentMethods(candidate).length) {
    throw new StoreError('Ative pelo menos uma forma de pagamento', 400)
  }

  const [updated] = await getDb()
    .update(schema.tenants)
    .set({
      deliveryFeeCents: Math.round(input.deliveryFee * 100),
      acceptsCash: input.acceptsCash,
      acceptsCardOnDelivery: input.acceptsCardOnDelivery,
      acceptsPixOnDelivery: input.acceptsPixOnDelivery,
      acceptsOnline: input.acceptsOnline,
      stockControl: input.stockControl,
      halfPricing: input.halfPricing,
      // undefined mantém; '' apaga.
      ...(input.pixKey !== undefined && { pixKey: input.pixKey?.trim() || null })
    })
    .where(eq(schema.tenants.id, tenant.id))
    .returning()

  return toSettings(updated)
}

function statusOf(tenant: Tenant) {
  return getStoreStatus(tenant.openingHours, tenant.statusOverride, tenant.timezone)
}

export async function getCurrentStoreStatus() {
  return statusOf(await getCurrentTenant())
}

export async function getOpeningHoursSettings() {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  return {
    hours: tenant.openingHours,
    override: tenant.statusOverride,
    status: statusOf(tenant)
  }
}

export async function updateOpeningHours(input: {
  hours: OpeningHours
  override: StatusOverride
}) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()

  const [updated] = await getDb()
    .update(schema.tenants)
    .set({ openingHours: input.hours, statusOverride: input.override })
    .where(eq(schema.tenants.id, tenant.id))
    .returning()

  return statusOf(updated)
}

export async function getAppearance() {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const domains = await getDb()
    .select({ host: schema.tenantDomains.host })
    .from(schema.tenantDomains)
    .where(eq(schema.tenantDomains.tenantId, tenant.id))

  const platformDomain = process.env.PLATFORM_DOMAIN?.trim()
  return {
    segment: tenant.segment,
    overrides: tenant.branding,
    // Valores em uso hoje, para mostrar o padrão quando o campo está vazio.
    effective: buildBranding(tenant.slug, tenant.name, tenant.branding, tenant.segment),
    domains: [
      ...(platformDomain ? [`${tenant.slug}.${platformDomain}`] : []),
      ...domains.map(domain => domain.host)
    ]
  }
}

export async function updateAppearance(segment: Segment, overrides: BrandingOverrides) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()

  await getDb()
    .update(schema.tenants)
    .set({ segment, branding: overrides, name: overrides.brandName?.trim() || tenant.name })
    .where(eq(schema.tenants.id, tenant.id))
}

export async function getProducts(): Promise<Product[]> {
  const tenant = await getCurrentTenant()
  if (tenant.stockControl) await releaseExpiredReservations(tenant.id)
  const rows = await getDb()
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.tenantId, tenant.id), eq(schema.products.active, true)))
    .orderBy(desc(schema.products.createdAt))

  return rows.map(row => toProduct(row, tenant.stockControl))
}

// Cardápio da loja com a regra de preço dos itens de vários sabores.
export async function getMenu() {
  const [products, tenant] = await Promise.all([getProducts(), getCurrentTenant()])
  return { products, halfPricing: tenant.halfPricing }
}

export async function getCategories(): Promise<Category[]> {
  const tenant = await getCurrentTenant()
  return getDb()
    .select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id))
    .orderBy(asc(schema.categories.position), asc(schema.categories.id))
}

export async function createCustomer(input: { name: string; email: string; password: string }) {
  const tenant = await getCurrentTenant()
  const email = input.email.trim().toLowerCase()

  const inserted = await getDb()
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      name: input.name.trim(),
      email,
      role: 'customer',
      passwordHash: hashPassword(input.password)
    })
    .onConflictDoNothing()
    .returning({ id: schema.users.id })

  if (!inserted.length) {
    throw new StoreError('Este e-mail já está cadastrado', 409)
  }
}

export type AdminProduct = Product & {
  description: string
  active: boolean
  categoryName: string
  // null = sem limite.
  stockQuantity: number | null
}

// Lista do painel: inclui produtos pausados.
export async function getAdminProducts(): Promise<AdminProduct[]> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  if (tenant.stockControl) await releaseExpiredReservations(tenant.id)
  const rows = await getDb()
    .select({ product: schema.products, categoryName: schema.categories.name })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
    .where(eq(schema.products.tenantId, tenant.id))
    .orderBy(asc(schema.categories.position), asc(schema.categories.id), asc(schema.products.name))

  return rows.map(({ product, categoryName }) => ({
    ...toProduct(product, tenant.stockControl),
    description: product.description ?? '',
    active: product.active,
    categoryName,
    stockQuantity: product.stockQuantity
  }))
}

export async function getAdminProduct(id: number): Promise<AdminProduct> {
  const products = await getAdminProducts()
  const product = products.find(item => item.id === id)
  if (!product) throw new StoreError('Produto não encontrado', 404)
  return product
}

const optionId = z.string().regex(/^[a-z0-9-]{1,40}$/i)
const optionName = z.string().trim().min(1, 'Dê um nome a cada opção').max(LIMITS.name)
const optionPrice = z.number().int().min(0).max(10_000_00)
const optionItem = z.object({ id: optionId, name: optionName, priceCents: optionPrice })

const optionsSchema = z
  .object({
    sizes: z
      .array(optionItem.extend({ priceCents: optionPrice.min(1, 'Informe o preço de cada tamanho') }))
      .max(LIMITS.sizes),
    maxFlavors: z.number().int().min(1).max(LIMITS.flavors),
    groups: z
      .array(
        z.object({
          id: optionId,
          name: optionName,
          min: z.number().int().min(0).max(LIMITS.itemsPerGroup),
          max: z.number().int().min(1).max(LIMITS.itemsPerGroup),
          items: z
            .array(optionItem)
            .min(1, 'Cada grupo precisa de pelo menos uma opção')
            .max(LIMITS.itemsPerGroup)
        })
      )
      .max(LIMITS.groups)
  })
  .superRefine((options, context) => {
    for (const group of options.groups) {
      if (group.min > group.max || group.max > group.items.length) {
        context.addIssue({
          code: 'custom',
          message: `Em ${group.name}: o mínimo não pode passar do máximo, nem o máximo do número de opções`
        })
      }
    }
    const ids = [...options.sizes, ...options.groups, ...options.groups.flatMap(group => group.items)].map(
      item => item.id
    )
    if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', message: 'Opções repetidas' })
    const sizeNames = options.sizes.map(size => size.name.toLowerCase())
    if (new Set(sizeNames).size !== sizeNames.length) {
      context.addIssue({ code: 'custom', message: 'Há dois tamanhos com o mesmo nome' })
    }
  })

// Campo só enviado pelo formulário novo; sem ele as opções atuais ficam como estão.
function parseOptions(raw: FormDataEntryValue | null): ProductOptions | undefined {
  if (raw === null) return undefined
  try {
    return optionsSchema.parse(JSON.parse(String(raw)))
  } catch (error) {
    throw new StoreError(
      error instanceof z.ZodError ? (error.issues[0]?.message ?? 'Opções inválidas') : 'Opções inválidas',
      400
    )
  }
}

// Campos do formulário de produto; a foto é obrigatória só ao cadastrar.
async function parseProductForm(formData: FormData, tenantId: string, requireImage: boolean) {
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const options = parseOptions(formData.get('options'))
  // Com tamanhos, o preço do card é o do menor tamanho ("a partir de").
  const priceCents = options?.sizes.length
    ? Math.min(...options.sizes.map(size => size.priceCents))
    : Math.round(Number(String(formData.get('price') ?? '0').replace(',', '.')) * 100)
  const categoryId = Number(formData.get('category_id') ?? 0)
  const offer = formData.get('offer') === 'true'
  const file = formData.get('file')
  const hasImage = file instanceof File && file.size > 0

  if (!name || name.length > 80) throw new StoreError('Informe o nome do produto (até 80 letras)', 400)
  if (description.length > 300) throw new StoreError('A descrição pode ter até 300 letras', 400)
  if (!(priceCents > 0) || priceCents > 10_000_00) throw new StoreError('Informe um preço válido', 400)
  if (requireImage && !hasImage) throw new StoreError('Escolha uma foto para o produto', 400)

  // Campo só enviado com o controle de estoque ligado. Vazio = sem limite.
  let stockQuantity: number | null | undefined
  if (formData.has('stock')) {
    const raw = String(formData.get('stock') ?? '').trim()
    stockQuantity = raw === '' ? null : Number(raw)
    if (stockQuantity !== null && (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 100_000)) {
      throw new StoreError('Estoque deve ser um número inteiro de 0 a 100.000, ou vazio para sem limite', 400)
    }
  }

  const [category] = await getDb()
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.tenantId, tenantId)))
  if (!category) throw new StoreError('Escolha uma categoria', 400)

  return {
    values: {
      name,
      description: description || null,
      priceCents,
      categoryId,
      offer,
      ...(options && { options }),
      ...(stockQuantity !== undefined && { stockQuantity })
    },
    file: hasImage ? (file as File) : null
  }
}

export async function createProduct(formData: FormData): Promise<Product> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const { values, file } = await parseProductForm(formData, tenant.id, true)

  const imageUrl = await uploadImage(file!, tenant.slug, 'products')
  const [row] = await getDb()
    .insert(schema.products)
    .values({ tenantId: tenant.id, ...values, imageUrl })
    .returning()

  return toProduct(row)
}

export async function updateProduct(id: number, formData: FormData): Promise<Product> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const { values, file } = await parseProductForm(formData, tenant.id, false)
  const imageUrl = file ? await uploadImage(file, tenant.slug, 'products') : undefined

  const [row] = await getDb()
    .update(schema.products)
    .set({ ...values, ...(imageUrl && { imageUrl }) })
    .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)))
    .returning()
  if (!row) throw new StoreError('Produto não encontrado', 404)

  return toProduct(row)
}

// Pausado = some do cardápio sem apagar (ex.: acabou o estoque).
export async function setProductActive(id: number, active: boolean) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const [row] = await getDb()
    .update(schema.products)
    .set({ active })
    .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)))
    .returning({ id: schema.products.id })
  if (!row) throw new StoreError('Produto não encontrado', 404)
}

// Pedidos antigos guardam nome e preço do item, então o histórico não se perde.
export async function deleteProduct(id: number) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const [row] = await getDb()
    .delete(schema.products)
    .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)))
    .returning({ id: schema.products.id })
  if (!row) throw new StoreError('Produto não encontrado', 404)
}

export type AdminCategory = Category & { position: number; products: number }

export async function getAdminCategories(): Promise<AdminCategory[]> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()
  const [categories, counts] = await Promise.all([
    db
      .select({ id: schema.categories.id, name: schema.categories.name, position: schema.categories.position })
      .from(schema.categories)
      .where(eq(schema.categories.tenantId, tenant.id))
      .orderBy(asc(schema.categories.position), asc(schema.categories.id)),
    db
      .select({ categoryId: schema.products.categoryId, total: count(schema.products.id) })
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenant.id))
      .groupBy(schema.products.categoryId)
  ])

  return categories.map(category => ({
    ...category,
    products: counts.find(item => item.categoryId === category.id)?.total ?? 0
  }))
}

function categoryName(raw: string) {
  const name = raw.trim()
  if (!name || name.length > 40) throw new StoreError('Informe o nome da categoria (até 40 letras)', 400)
  return name
}

export async function createCategory(rawName: string) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()
  const [last] = await db
    .select({ position: schema.categories.position })
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id))
    .orderBy(desc(schema.categories.position))
    .limit(1)

  const [row] = await db
    .insert(schema.categories)
    .values({ tenantId: tenant.id, name: categoryName(rawName), position: (last?.position ?? -1) + 1 })
    .returning({ id: schema.categories.id })
  return row
}

export async function renameCategory(id: number, rawName: string) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const [row] = await getDb()
    .update(schema.categories)
    .set({ name: categoryName(rawName) })
    .where(and(eq(schema.categories.id, id), eq(schema.categories.tenantId, tenant.id)))
    .returning({ id: schema.categories.id })
  if (!row) throw new StoreError('Categoria não encontrada', 404)
}

// Troca de lugar com a vizinha de cima ou de baixo (renumera tudo para evitar empates).
export async function moveCategory(id: number, direction: 'up' | 'down') {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()
  const ordered = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id))
    .orderBy(asc(schema.categories.position), asc(schema.categories.id))

  const index = ordered.findIndex(item => item.id === id)
  if (index < 0) throw new StoreError('Categoria não encontrada', 404)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= ordered.length) return

  ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
  await db.transaction(async tx => {
    for (const [position, item] of ordered.entries()) {
      await tx.update(schema.categories).set({ position }).where(eq(schema.categories.id, item.id))
    }
  })
}

export async function deleteCategory(id: number) {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()
  const [{ total }] = await db
    .select({ total: count(schema.products.id) })
    .from(schema.products)
    .where(and(eq(schema.products.categoryId, id), eq(schema.products.tenantId, tenant.id)))
  if (total > 0) {
    throw new StoreError(`Esta categoria tem ${total} produto(s). Mova ou exclua os produtos antes.`, 409)
  }

  const [row] = await db
    .delete(schema.categories)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.tenantId, tenant.id)))
    .returning({ id: schema.categories.id })
  if (!row) throw new StoreError('Categoria não encontrada', 404)
}

export async function getOrders(): Promise<Order[]> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()
  // Pedidos online abandonados saem da fila (e devolvem estoque) antes de listar.
  await releaseExpiredReservations(tenant.id)
  // Avisos de WhatsApp que ficaram na fila saem agora, em segundo plano.
  after(() => drainOutbox(tenant.id))

  const rows = await db
    .select({ order: schema.orders, customer: schema.users })
    .from(schema.orders)
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.customerId))
    .where(eq(schema.orders.tenantId, tenant.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(100)

  const items = rows.length
    ? await db
        .select()
        .from(schema.orderItems)
        .where(inArray(schema.orderItems.orderId, rows.map(row => row.order.id)))
    : []

  return rows.map(({ order, customer }) => ({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    // Contato informado no pedido; pedidos antigos (antes do telefone) usam o cadastro.
    customer: {
      name: order.customerName ?? customer.name,
      phone: order.customerPhone ?? customer.phone,
      email: customer.email
    },
    whatsappOptIn: order.whatsappOptIn,
    products: items
      .filter(item => item.orderId === order.id)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: toReais(item.unitPriceCents),
        quantity: item.quantity,
        details: item.details,
        note: item.note
      })),
    subtotal: toReais(order.subtotalCents),
    deliveryFee: toReais(order.deliveryFeeCents),
    total: toReais(order.totalCents),
    paymentMethod: order.paymentMethod,
    changeFor: order.changeForCents === null ? null : toReais(order.changeForCents),
    // Mensagem da etapa atual, para o botão manual "Avisar no WhatsApp".
    whatsappText: orderMessage(
      order,
      tenant,
      items.filter(item => item.orderId === order.id)
    )
  }))
}

// Preços e taxa sempre vêm do banco; o cliente só informa ids e quantidades.
type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]

// Prazo para pagar um pedido online. Depois disso ele é cancelado e o estoque volta;
// o link do Mercado Pago expira no mesmo prazo.
export const PAYMENT_WINDOW_MINUTES = 60

// Devolve ao estoque as unidades de um pedido que tinha reservado (uma vez só).
async function releaseStock(tx: Tx, orderId: string) {
  const [order] = await tx
    .update(schema.orders)
    .set({ stockReserved: false })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.stockReserved, true)))
    .returning({ id: schema.orders.id })
  if (!order) return

  const items = await tx
    .select({ productId: schema.orderItems.productId, quantity: schema.orderItems.quantity })
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId))

  for (const item of items) {
    if (!item.productId) continue
    await tx
      .update(schema.products)
      .set({ stockQuantity: sql`${schema.products.stockQuantity} + ${item.quantity}` })
      .where(and(eq(schema.products.id, item.productId), isNotNull(schema.products.stockQuantity)))
  }
}

async function cancelOrder(tx: Tx, orderId: string, fromStatus: OrderStatus) {
  const [updated] = await tx
    .update(schema.orders)
    .set({ status: 'canceled', updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, fromStatus)))
    .returning({ id: schema.orders.id, status: schema.orders.status })
  if (updated) await releaseStock(tx, orderId)
  return updated
}

// Cancela pedidos online não pagos dentro do prazo. Roda ao abrir cardápio, pedidos e
// checkout, então não depende de agendador.
async function releaseExpiredReservations(tenantId: string) {
  const db = getDb()
  const expired = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.tenantId, tenantId),
        eq(schema.orders.status, 'awaiting_payment'),
        lt(schema.orders.createdAt, new Date(Date.now() - PAYMENT_WINDOW_MINUTES * 60_000))
      )
    )
  for (const order of expired) {
    await db.transaction(tx => cancelOrder(tx, order.id, 'awaiting_payment'))
  }
}

// Quem está pedindo: conta logada (sessionUser) ou cliente sem cadastro (nome + celular).
export type OrderContact = {
  name: string
  phone: string
  whatsappOptIn: boolean
  sessionUser?: User | null
}

// Limite contra pedidos falsos em massa com o mesmo telefone.
const MAX_ORDERS_PER_PHONE = 5
const ORDER_BURST_MINUTES = 10

// Encontra o cliente pelo telefone (ou usa a conta logada) e guarda o nome mais recente.
async function resolveCustomer(tenantId: string, contact: OrderContact, phone: string) {
  const db = getDb()
  if (contact.sessionUser) {
    // Conta logada sem telefone ganha o informado, se nenhum outro cliente já usa esse número.
    if (!contact.sessionUser.phone) {
      await db
        .update(schema.users)
        .set({ phone })
        .where(eq(schema.users.id, contact.sessionUser.id))
        .catch(() => {})
    }
    return contact.sessionUser.id
  }

  const [customer] = await db
    .insert(schema.users)
    .values({ tenantId, name: contact.name, phone, role: 'customer' })
    .onConflictDoUpdate({
      target: [schema.users.tenantId, schema.users.phone],
      set: { name: contact.name },
      // Só renomeia clientes; conta da equipe com esse telefone não é alterada.
      setWhere: eq(schema.users.role, 'customer')
    })
    .returning({ id: schema.users.id })
  if (customer) return customer.id

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.phone, phone)))
  return existing.id
}

export type OrderItemInput = ItemSelection & { id: number; quantity: number }

export async function createOrder(
  contact: OrderContact,
  input: OrderItemInput[],
  payment: { method: PaymentMethod; changeFor?: number | null }
) {
  const tenant = await getCurrentTenant()
  const db = getDb()
  await releaseExpiredReservations(tenant.id)

  const name = contact.name.trim()
  if (name.length < 2 || name.length > 80) throw new StoreError('Informe seu nome', 400)
  const phone = normalizeBrMobile(contact.phone)
  if (!phone) throw new StoreError('Informe um celular válido com DDD, ex.: (11) 98765-4321', 400)

  const [{ recent }] = await db
    .select({ recent: count(schema.orders.id) })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.tenantId, tenant.id),
        eq(schema.orders.customerPhone, phone),
        gte(schema.orders.createdAt, new Date(Date.now() - ORDER_BURST_MINUTES * 60_000))
      )
    )
  if (recent >= MAX_ORDERS_PER_PHONE) {
    throw new StoreError('Muitos pedidos seguidos com este telefone. Aguarde alguns minutos.', 429)
  }

  const status = statusOf(tenant)
  if (!status.open) {
    throw new StoreError(`A loja está fechada agora. ${status.label}.`, 409)
  }

  if (!enabledPaymentMethods(toSettings(tenant)).includes(payment.method)) {
    throw new StoreError('Esta forma de pagamento não está disponível nesta loja', 400)
  }

  // Produtos do carrinho e os sabores extras escolhidos.
  const ids = [...new Set(input.flatMap(item => [item.id, ...(item.flavors ?? [])]))]
  const catalog = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.tenantId, tenant.id),
        eq(schema.products.active, true),
        inArray(schema.products.id, ids)
      )
    )

  // Cada linha tem suas escolhas; o preço sai sempre do cadastro, nunca do navegador.
  const lines = input.map(item => {
    const product = catalog.find(candidate => candidate.id === item.id)
    if (!product) {
      throw new StoreError(
        'Um item do seu carrinho não está mais disponível. Remova-o do carrinho e tente de novo.',
        409
      )
    }
    // Sabor extra: produto da mesma categoria que também aceita vários sabores.
    const findFlavor = (id: number) =>
      catalog.find(
        candidate =>
          candidate.id === id && candidate.categoryId === product.categoryId && candidate.options.maxFlavors > 1
      )
    try {
      const priced = priceSelection(product, item, findFlavor, tenant.halfPricing)
      return { product, quantity: item.quantity, ...priced }
    } catch (error) {
      if (error instanceof SelectionError) throw new StoreError(`${error.message}. Ajuste o item no carrinho.`, 409)
      throw error
    }
  })

  // O estoque conta o produto principal, somando as linhas dele.
  const quantities = new Map<number, number>()
  for (const line of lines) {
    quantities.set(line.product.id, (quantities.get(line.product.id) ?? 0) + line.quantity)
  }
  const stockLines = [...quantities].map(([id, quantity]) => ({
    product: catalog.find(candidate => candidate.id === id)!,
    quantity
  }))

  const stockProblem = (product: (typeof catalog)[number]) =>
    new StoreError(
      (product.stockQuantity ?? 0) <= 0
        ? `${product.name} esgotou. Remova do carrinho para continuar.`
        : `Só restam ${product.stockQuantity} unidade(s) de ${product.name}. Ajuste a quantidade no carrinho.`,
      409
    )

  const limited = tenant.stockControl
    ? stockLines.filter(({ product }) => product.stockQuantity !== null)
    : []
  for (const { product, quantity } of limited) {
    if (quantity > (product.stockQuantity ?? 0)) throw stockProblem(product)
  }

  const subtotalCents = lines.reduce((sum, { unitCents, quantity }) => sum + unitCents * quantity, 0)
  const deliveryFeeCents = tenant.deliveryFeeCents
  const totalCents = subtotalCents + deliveryFeeCents

  const changeForCents =
    payment.method === 'cash' && payment.changeFor ? Math.round(payment.changeFor * 100) : null
  if (changeForCents !== null && changeForCents < totalCents) {
    throw new StoreError('O troco precisa ser para um valor maior que o total', 400)
  }

  const customerId = await resolveCustomer(tenant.id, { ...contact, name }, phone)

  const order = await db.transaction(async tx => {
    // Desconto condicional: se outro pedido levou as últimas unidades, a transação desfaz tudo.
    for (const { product, quantity } of limited) {
      const [taken] = await tx
        .update(schema.products)
        .set({ stockQuantity: sql`${schema.products.stockQuantity} - ${quantity}` })
        .where(and(eq(schema.products.id, product.id), gte(schema.products.stockQuantity, quantity)))
        .returning({ id: schema.products.id })
      if (!taken) throw stockProblem(product)
    }

    const [created] = await tx
      .insert(schema.orders)
      .values({
        tenantId: tenant.id,
        customerId,
        customerName: name,
        customerPhone: phone,
        whatsappOptIn: contact.whatsappOptIn,
        subtotalCents,
        deliveryFeeCents,
        totalCents,
        paymentMethod: payment.method,
        changeForCents,
        stockReserved: limited.length > 0,
        // Pagamento na entrega vai direto para a cozinha.
        status: payment.method === 'online' ? 'awaiting_payment' : 'confirmed'
      })
      .returning()

    await tx.insert(schema.orderItems).values(
      lines.map(({ product, quantity, unitCents, details, note }) => ({
        orderId: created.id,
        productId: product.id,
        name: product.name,
        unitPriceCents: unitCents,
        quantity,
        details,
        note
      }))
    )

    return created
  })

  // Pagamento na entrega já nasce confirmado; o online avisa quando o pagamento aprovar.
  if (order.status === 'confirmed') await notifyOrder(order.id, 'confirmed')

  return {
    order,
    lines: lines.map(({ product, quantity, unitCents, details }) => ({
      id: product.id,
      name: details ? `${product.name} (${details})` : product.name,
      url: product.imageUrl,
      unitPrice: toReais(unitCents),
      quantity
    })),
    deliveryFee: toReais(deliveryFeeCents)
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await requireAdminSession()
  assertOrderId(id)
  const tenant = await getCurrentTenant()
  const db = getDb()

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.tenantId, tenant.id)))

  if (!order) throw new StoreError('Pedido não encontrado', 404)
  if (!orderStatusTransitions[order.status].includes(status)) {
    throw new StoreError('Mudança de status não permitida', 409)
  }

  const updated =
    status === 'canceled'
      ? await db.transaction(tx => cancelOrder(tx, id, order.status))
      : (
          await db
            .update(schema.orders)
            .set({ status, updatedAt: new Date() })
            .where(and(eq(schema.orders.id, id), eq(schema.orders.status, order.status)))
            .returning({ id: schema.orders.id, status: schema.orders.status })
        )[0]

  if (!updated) throw new StoreError('O pedido mudou enquanto você editava', 409)
  await notifyOrder(id, status)
  return updated
}

// Pedido online cujo checkout não pôde ser aberto: não deve ficar na fila da loja.
export async function cancelUnpaidOrder(orderId: string) {
  assertOrderId(orderId)
  await getDb().transaction(tx => cancelOrder(tx, orderId, 'awaiting_payment'))
}

// Chamado pelo webhook (sem host da loja), por isso localiza o pedido só pelo id.
// Idempotente: só confirma pedidos que ainda aguardam pagamento e cujo valor confere.
export async function confirmOrderPayment(input: {
  orderId: string
  paymentId: string
  paymentStatus: string
  amountPaid: number
}) {
  assertOrderId(input.orderId)
  const db = getDb()
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId))

  if (!order) throw new StoreError('Pedido não encontrado', 404)
  if (order.status === 'canceled') {
    // Pagou depois do prazo (pedido já cancelado e estoque devolvido): precisa de estorno manual.
    console.warn('[pagamento] aprovado para pedido cancelado; avaliar estorno', order.id, input.paymentId)
  }
  if (order.status !== 'awaiting_payment') return order

  if (Math.round(input.amountPaid * 100) < order.totalCents) {
    throw new StoreError('Valor pago menor que o total do pedido', 409)
  }

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: 'confirmed',
      paymentId: input.paymentId,
      paymentStatus: input.paymentStatus,
      updatedAt: new Date()
    })
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, 'awaiting_payment')))
    .returning()

  if (updated) await notifyOrder(updated.id, 'confirmed')
  return updated ?? order
}
