import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'

import { getTenantBranding } from '@/lib/branding-server'
import type { Category, Order, Product, User } from '@/lib/types'

type StoredUser = User & {
  id: string
  passwordHash: string
  createdAt: string
}

type StoredOrder = Order & {
  payment_id?: string
  payment_status?: string
}

type SessionRecord = {
  token: string
  userId: string
  createdAt: string
}

type TenantRecord = {
  categories: Category[]
  products: Product[]
  users: StoredUser[]
  orders: StoredOrder[]
  sessions: SessionRecord[]
  nextProductId: number
}

type Database = {
  tenants: Record<string, TenantRecord>
}

const dataDir = path.join(process.cwd(), '.data')
const dbPath = path.join(dataDir, 'store.json')
const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

export class LocalStoreError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) return false

  const derivedHash = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(storedHash, 'hex')

  if (storedBuffer.length !== derivedHash.length) return false
  return timingSafeEqual(storedBuffer, derivedHash)
}

function createSeedTenant(
  namespace: string,
  assets: Awaited<ReturnType<typeof getTenantBranding>>['assets']
): TenantRecord {
  const now = new Date().toISOString()
  const adminEmail = `admin@${namespace}.local`
  const customerEmail = `cliente@${namespace}.local`

  return {
    categories: [
      { id: 1, name: 'Destaques' },
      { id: 2, name: 'Combos' },
      { id: 3, name: 'Bebidas' }
    ],
    products: [
      {
        id: 101,
        name: 'Sanduiche Especial',
        price: 29.9,
        category_id: 1,
        offer: true,
        url: assets.homeHeroPath
      },
      {
        id: 102,
        name: 'Receita da Casa',
        price: 34.9,
        category_id: 1,
        offer: true,
        url: assets.catalogHeroPath
      },
      {
        id: 103,
        name: 'Combo Premium',
        price: 42.9,
        category_id: 2,
        url: assets.loginImagePath
      },
      {
        id: 104,
        name: 'Bebida Gelada',
        price: 8,
        category_id: 3,
        url: assets.logoPath
      }
    ],
    users: [
      {
        id: randomUUID(),
        name: 'Administrador',
        email: adminEmail,
        admin: true,
        passwordHash: hashPassword('123456'),
        createdAt: now
      },
      {
        id: randomUUID(),
        name: 'Cliente Demo',
        email: customerEmail,
        admin: false,
        passwordHash: hashPassword('123456'),
        createdAt: now
      }
    ],
    orders: [],
    sessions: [],
    nextProductId: 105
  }
}

async function ensureDatabase() {
  await mkdir(dataDir, { recursive: true })

  try {
    await readFile(dbPath, 'utf8')
  } catch {
    const initialData: Database = { tenants: {} }
    await writeFile(dbPath, JSON.stringify(initialData, null, 2), 'utf8')
  }
}

async function readDatabase(): Promise<Database> {
  await ensureDatabase()
  const raw = await readFile(dbPath, 'utf8')
  return JSON.parse(raw) as Database
}

async function writeDatabase(database: Database) {
  await writeFile(dbPath, JSON.stringify(database, null, 2), 'utf8')
}

async function getTenantRecord() {
  const branding = await getTenantBranding()
  const { namespace } = branding
  const database = await readDatabase()

  if (!database.tenants[namespace]) {
    database.tenants[namespace] = createSeedTenant(namespace, branding.assets)
    await writeDatabase(database)
  }

  return {
    namespace,
    database,
    tenant: database.tenants[namespace],
    branding
  }
}

function sanitizeFileName(value: string) {
  const ext = path.extname(value).toLowerCase()
  const base = path.basename(value, ext)
  const safeBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeBase || 'imagem'}${ext || '.webp'}`
}

async function saveProductImage(file: File, namespace: string) {
  const tenantUploadDir = path.join(uploadsDir, namespace)
  await mkdir(tenantUploadDir, { recursive: true })

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const targetPath = path.join(tenantUploadDir, fileName)

  await writeFile(targetPath, buffer)
  return `/uploads/${namespace}/${fileName}`
}

export async function listLocalProducts(): Promise<Product[]> {
  const { tenant } = await getTenantRecord()
  return tenant.products
}

export async function listLocalCategories(): Promise<Category[]> {
  const { tenant } = await getTenantRecord()
  return tenant.categories
}

export async function createLocalUser(input: {
  name: string
  email: string
  password: string
}) {
  const { database, namespace, tenant } = await getTenantRecord()
  const email = input.email.trim().toLowerCase()

  if (tenant.users.some(user => user.email.toLowerCase() === email)) {
    throw new LocalStoreError('Este e-mail já está cadastrado', 409)
  }

  tenant.users.push({
    id: randomUUID(),
    name: input.name.trim(),
    email,
    admin: false,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString()
  })

  database.tenants[namespace] = tenant
  await writeDatabase(database)
}

export async function createLocalSession(input: {
  email: string
  password: string
}) {
  const { database, namespace, tenant } = await getTenantRecord()
  const email = input.email.trim().toLowerCase()
  const user = tenant.users.find(candidate => candidate.email.toLowerCase() === email)

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new LocalStoreError('E-mail ou senha inválidos', 401)
  }

  const token = randomUUID()
  tenant.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() })
  database.tenants[namespace] = tenant
  await writeDatabase(database)

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      admin: user.admin
    } satisfies User
  }
}

export async function createLocalProduct(formData: FormData): Promise<Product> {
  const { database, namespace, tenant } = await getTenantRecord()
  const name = String(formData.get('name') ?? '').trim()
  const price = Number(formData.get('price') ?? 0)
  const categoryId = Number(formData.get('category_id') ?? 0)
  const offer = formData.get('offer') === 'true'
  const file = formData.get('file')

  if (!name || !price || !categoryId || !(file instanceof File) || !file.size) {
    throw new LocalStoreError('Dados inválidos do produto', 400)
  }

  const category = tenant.categories.find(item => item.id === categoryId)
  if (!category) {
    throw new LocalStoreError('Categoria inválida', 400)
  }

  const imageUrl = await saveProductImage(file, namespace)
  const product: Product = {
    id: tenant.nextProductId,
    name,
    price,
    category_id: categoryId,
    category,
    offer,
    url: imageUrl
  }

  tenant.products.unshift(product)
  tenant.nextProductId += 1
  database.tenants[namespace] = tenant
  await writeDatabase(database)

  return product
}

export async function listLocalOrders(): Promise<Order[]> {
  const { tenant } = await getTenantRecord()
  return [...tenant.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createLocalOrder(input: {
  products: Array<{ id: number; quantity: number }>
  user: Pick<User, 'name' | 'email'>
}) {
  const { database, namespace, tenant } = await getTenantRecord()

  const products = input.products.map(item => {
    const product = tenant.products.find(candidate => candidate.id === item.id)
    if (!product) {
      throw new LocalStoreError(`Produto ${item.id} não encontrado`, 404)
    }

    return { ...product, quantity: item.quantity }
  })

  const order: StoredOrder = {
    _id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'Aguardando pagamento',
    user: {
      name: input.user.name,
      email: input.user.email
    },
    products
  }

  tenant.orders.unshift(order)
  database.tenants[namespace] = tenant
  await writeDatabase(database)

  return { _id: order._id, id: order._id }
}

export async function updateLocalOrderStatus(id: string, status: string) {
  const { database, namespace, tenant } = await getTenantRecord()
  const order = tenant.orders.find(item => item._id === id)

  if (!order) {
    throw new LocalStoreError('Pedido não encontrado', 404)
  }

  order.status = status
  database.tenants[namespace] = tenant
  await writeDatabase(database)

  return order
}

export async function markLocalOrderPaid(input: {
  id: string
  paymentId: string
  paymentStatus: string
}) {
  const { database, namespace, tenant } = await getTenantRecord()
  const order = tenant.orders.find(item => item._id === input.id)

  if (!order) {
    throw new LocalStoreError('Pedido não encontrado', 404)
  }

  order.status = 'Pedido realizado'
  order.payment_id = input.paymentId
  order.payment_status = input.paymentStatus
  database.tenants[namespace] = tenant
  await writeDatabase(database)

  return order
}