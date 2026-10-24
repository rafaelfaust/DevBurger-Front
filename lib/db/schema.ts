import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

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

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

// Uma loja (restaurante) cliente do SaaS. O slug é o namespace do branding.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(500),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt()
})

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('customer'),
    createdAt: createdAt()
  },
  table => [uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email)]
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
