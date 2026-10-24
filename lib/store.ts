import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { and, asc, desc, eq, inArray } from 'drizzle-orm'

import { requireAdminSession } from '@/lib/auth'
import { getDb, schema } from '@/lib/db'
import { orderStatusTransitions, type OrderStatus } from '@/lib/order-status'
import { hashPassword } from '@/lib/password'
import {
  enabledPaymentMethods,
  type PaymentMethod,
  type StoreSettings
} from '@/lib/payment-methods'
import { isOnlinePaymentAvailable } from '@/lib/payments'
import { getCurrentTenant, StoreError, type Tenant } from '@/lib/tenant'
import type { Category, Order, Product, User } from '@/lib/types'

export { StoreError }

const toReais = (cents: number) => cents / 100

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function assertOrderId(id: string) {
  if (!uuidPattern.test(id)) throw new StoreError('Pedido não encontrado', 404)
}

function toProduct(row: typeof schema.products.$inferSelect): Product {
  return {
    id: row.id,
    name: row.name,
    price: toReais(row.priceCents),
    url: row.imageUrl,
    offer: row.offer,
    category_id: row.categoryId
  }
}

function toSettings(tenant: Tenant): StoreSettings {
  return {
    deliveryFee: toReais(tenant.deliveryFeeCents),
    acceptsCash: tenant.acceptsCash,
    acceptsCardOnDelivery: tenant.acceptsCardOnDelivery,
    acceptsPixOnDelivery: tenant.acceptsPixOnDelivery,
    acceptsOnline: tenant.acceptsOnline,
    onlineAvailable: isOnlinePaymentAvailable()
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return toSettings(await getCurrentTenant())
}

export async function updateStoreSettings(
  input: Omit<StoreSettings, 'onlineAvailable'>
): Promise<StoreSettings> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()

  if (!enabledPaymentMethods({ ...input, onlineAvailable: isOnlinePaymentAvailable() }).length) {
    throw new StoreError('Ative pelo menos uma forma de pagamento', 400)
  }

  const [updated] = await getDb()
    .update(schema.tenants)
    .set({
      deliveryFeeCents: Math.round(input.deliveryFee * 100),
      acceptsCash: input.acceptsCash,
      acceptsCardOnDelivery: input.acceptsCardOnDelivery,
      acceptsPixOnDelivery: input.acceptsPixOnDelivery,
      acceptsOnline: input.acceptsOnline
    })
    .where(eq(schema.tenants.id, tenant.id))
    .returning()

  return toSettings(updated)
}

export async function getProducts(): Promise<Product[]> {
  const tenant = await getCurrentTenant()
  const rows = await getDb()
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.tenantId, tenant.id), eq(schema.products.active, true)))
    .orderBy(desc(schema.products.createdAt))

  return rows.map(toProduct)
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

function sanitizeFileName(value: string) {
  const ext = path.extname(value).toLowerCase()
  const base = path.basename(value, ext)
  const safeBase = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeBase || 'imagem'}${ext || '.webp'}`
}

// Provisório até termos storage de objetos: grava em public/uploads, que só é servido em dev.
async function saveProductImage(file: File, tenantSlug: string) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new StoreError(
      'Upload de produto não está disponível neste ambiente sem armazenamento persistente',
      503
    )
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', tenantSlug)
  await mkdir(uploadDir, { recursive: true })

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
  await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${tenantSlug}/${fileName}`
}

export async function createProduct(formData: FormData): Promise<Product> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()

  const name = String(formData.get('name') ?? '').trim()
  const priceCents = Math.round(Number(formData.get('price') ?? 0) * 100)
  const categoryId = Number(formData.get('category_id') ?? 0)
  const offer = formData.get('offer') === 'true'
  const file = formData.get('file')

  if (!name || !(priceCents > 0) || !categoryId || !(file instanceof File) || !file.size) {
    throw new StoreError('Dados inválidos do produto', 400)
  }

  const [category] = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.tenantId, tenant.id)))

  if (!category) throw new StoreError('Categoria inválida', 400)

  const imageUrl = await saveProductImage(file, tenant.slug)
  const [row] = await db
    .insert(schema.products)
    .values({ tenantId: tenant.id, categoryId, name, priceCents, offer, imageUrl })
    .returning()

  return toProduct(row)
}

export async function getOrders(): Promise<Order[]> {
  await requireAdminSession()
  const tenant = await getCurrentTenant()
  const db = getDb()

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
    user: { name: customer.name, email: customer.email },
    products: items
      .filter(item => item.orderId === order.id)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: toReais(item.unitPriceCents),
        quantity: item.quantity
      })),
    subtotal: toReais(order.subtotalCents),
    deliveryFee: toReais(order.deliveryFeeCents),
    total: toReais(order.totalCents),
    paymentMethod: order.paymentMethod,
    changeFor: order.changeForCents === null ? null : toReais(order.changeForCents)
  }))
}

// Preços e taxa sempre vêm do banco; o cliente só informa ids e quantidades.
export async function createOrder(
  customer: User,
  input: Array<{ id: number; quantity: number }>,
  payment: { method: PaymentMethod; changeFor?: number | null }
) {
  const tenant = await getCurrentTenant()
  const db = getDb()

  if (!enabledPaymentMethods(toSettings(tenant)).includes(payment.method)) {
    throw new StoreError('Esta forma de pagamento não está disponível nesta loja', 400)
  }

  const ids = [...new Set(input.map(item => item.id))]
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

  const lines = input.map(item => {
    const product = catalog.find(candidate => candidate.id === item.id)
    if (!product) throw new StoreError(`Produto ${item.id} não encontrado`, 404)
    return { product, quantity: item.quantity }
  })

  const subtotalCents = lines.reduce(
    (sum, { product, quantity }) => sum + product.priceCents * quantity,
    0
  )
  const deliveryFeeCents = tenant.deliveryFeeCents
  const totalCents = subtotalCents + deliveryFeeCents

  const changeForCents =
    payment.method === 'cash' && payment.changeFor ? Math.round(payment.changeFor * 100) : null
  if (changeForCents !== null && changeForCents < totalCents) {
    throw new StoreError('O troco precisa ser para um valor maior que o total', 400)
  }

  const order = await db.transaction(async tx => {
    const [created] = await tx
      .insert(schema.orders)
      .values({
        tenantId: tenant.id,
        customerId: customer.id,
        subtotalCents,
        deliveryFeeCents,
        totalCents,
        paymentMethod: payment.method,
        changeForCents,
        // Pagamento na entrega vai direto para a cozinha.
        status: payment.method === 'online' ? 'awaiting_payment' : 'confirmed'
      })
      .returning()

    await tx.insert(schema.orderItems).values(
      lines.map(({ product, quantity }) => ({
        orderId: created.id,
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity
      }))
    )

    return created
  })

  return {
    order,
    lines: lines.map(({ product, quantity }) => ({ product: toProduct(product), quantity })),
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

  const [updated] = await db
    .update(schema.orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, id), eq(schema.orders.status, order.status)))
    .returning({ id: schema.orders.id, status: schema.orders.status })

  if (!updated) throw new StoreError('O pedido mudou enquanto você editava', 409)
  return updated
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

  return updated ?? order
}
