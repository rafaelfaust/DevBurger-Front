import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

import type { BrandingOverrides } from '@/lib/branding'
import type { OpeningHours, StatusOverride } from '@/lib/opening-hours'
import type { Segment } from '@/lib/segments'

export const userRole = pgEnum('user_role', ['owner', 'staff', 'customer'])

export const orderStatus = pgEnum('order_status', [
  'awaiting_payment',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'canceled'
])

export const paymentMethod = pgEnum('payment_method', [
  'online',
  'cash',
  'card_on_delivery',
  'pix_on_delivery'
])

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

// Uma loja (restaurante) cliente do SaaS. O slug é o namespace do branding.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(500),
  acceptsCash: boolean('accepts_cash').notNull().default(true),
  acceptsCardOnDelivery: boolean('accepts_card_on_delivery').notNull().default(true),
  acceptsPixOnDelivery: boolean('accepts_pix_on_delivery').notNull().default(true),
  acceptsOnline: boolean('accepts_online').notNull().default(false),
  // Opcional: com estoque ligado, pedidos descontam de products.stock_quantity.
  stockControl: boolean('stock_control').notNull().default(false),
  // Tipo de loja: define os padrões de textos, cores e imagens (lib/segments.ts).
  segment: text('segment').$type<Segment>().notNull().default('outro'),
  // Só os campos que a loja personalizou; o resto vem do padrão do segmento.
  branding: jsonb('branding').$type<BrandingOverrides>().notNull().default({}),
  // Sem turnos cadastrados a loja fica sempre aberta.
  openingHours: jsonb('opening_hours').$type<OpeningHours>().notNull().default({}),
  statusOverride: text('status_override').$type<StatusOverride>(),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt()
})

// Domínios próprios de cada loja (ex.: pedidos.hamburgueria.com.br).
export const tenantDomains = pgTable(
  'tenant_domains',
  {
    host: text('host').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    createdAt: createdAt()
  },
  table => [index('tenant_domains_tenant_idx').on(table.tenantId)]
)

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Cliente que pediu sem cadastro tem só nome e telefone (sem e-mail nem senha).
    email: text('email'),
    passwordHash: text('password_hash'),
    // Celular com DDI, só dígitos: 5511987654321.
    phone: text('phone'),
    role: userRole('role').notNull().default('customer'),
    createdAt: createdAt()
  },
  table => [
    uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email),
    uniqueIndex('users_tenant_phone_idx').on(table.tenantId, table.phone)
  ]
)

// O cookie guarda o token puro; aqui só o hash SHA-256 dele.
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt()
  },
  table => [index('sessions_user_idx').on(table.userId)]
)

export const categories = pgTable(
  'categories',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    position: integer('position').notNull().default(0)
  },
  table => [index('categories_tenant_idx').on(table.tenantId)]
)

export const products = pgTable(
  'products',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    imageUrl: text('image_url').notNull(),
    offer: boolean('offer').notNull().default(false),
    active: boolean('active').notNull().default(true),
    // null = sem limite (mesmo com o controle de estoque da loja ligado).
    stockQuantity: integer('stock_quantity'),
    createdAt: createdAt()
  },
  table => [index('products_tenant_idx').on(table.tenantId)]
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatus('status').notNull().default('awaiting_payment'),
    subtotalCents: integer('subtotal_cents').notNull(),
    deliveryFeeCents: integer('delivery_fee_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    paymentMethod: paymentMethod('payment_method').notNull().default('online'),
    // Troco para (só pagamento em dinheiro).
    changeForCents: integer('change_for_cents'),
    // Contato informado neste pedido (o cliente pode trocar de nome entre pedidos).
    customerName: text('customer_name'),
    customerPhone: text('customer_phone'),
    // Cliente aceitou receber avisos do pedido no WhatsApp (consentimento LGPD).
    whatsappOptIn: boolean('whatsapp_opt_in').notNull().default(false),
    // O pedido descontou estoque; ao cancelar, as unidades voltam.
    stockReserved: boolean('stock_reserved').notNull().default(false),
    paymentId: text('payment_id'),
    paymentStatus: text('payment_status'),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  table => [index('orders_tenant_created_idx').on(table.tenantId, table.createdAt)]
)

// Nome e preço são copiados do produto no momento da compra.
export const orderItems = pgTable(
  'order_items',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').references(() => products.id, {
      onDelete: 'set null'
    }),
    name: text('name').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull()
  },
  table => [index('order_items_order_idx').on(table.orderId)]
)

// Administradores da plataforma (você e sua equipe). Separados dos usuários das lojas.
export const platformAdmins = pgTable('platform_admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: createdAt()
})

export const platformSessions = pgTable(
  'platform_sessions',
  {
    id: text('id').primaryKey(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => platformAdmins.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt()
  },
  table => [index('platform_sessions_admin_idx').on(table.adminId)]
)
