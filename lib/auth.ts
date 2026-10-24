import { createHash, randomBytes } from 'node:crypto'

import { and, eq, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { cache } from 'react'

import { getSessionCookieNames } from '@/lib/branding-server'
import { getDb, schema } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { getCurrentTenant, StoreError } from '@/lib/tenant'
import type { User } from '@/lib/types'

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function toUser(row: typeof schema.users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    admin: row.role !== 'customer'
  }
}

export async function signIn(input: { email: string; password: string }) {
  const tenant = await getCurrentTenant()
  const db = getDb()
  const [row] = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.tenantId, tenant.id),
        eq(schema.users.email, input.email.trim().toLowerCase())
      )
    )

  if (!row || !verifyPassword(input.password, row.passwordHash)) {
    throw new StoreError('E-mail ou senha inválidos', 401)
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId: row.id,
    tenantId: tenant.id,
    expiresAt
  })

  const { token: cookieName } = await getSessionCookieNames()
  ;(await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  })

  return toUser(row)
}

export async function signOut() {
  const { token: cookieName } = await getSessionCookieNames()
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieName)?.value

  if (token) {
    await getDb().delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)))
  }

  cookieStore.delete(cookieName)
}

// O usuário vem sempre do banco: o cookie só carrega um token opaco.
export const getSessionUser = cache(async (): Promise<User | null> => {
  const { token: cookieName } = await getSessionCookieNames()
  const token = (await cookies()).get(cookieName)?.value
  if (!token) return null

  const tenant = await getCurrentTenant().catch(() => null)
  if (!tenant) return null

  const [row] = await getDb()
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.id, hashToken(token)),
        eq(schema.sessions.tenantId, tenant.id),
        gt(schema.sessions.expiresAt, new Date())
      )
    )

  return row ? toUser(row.user) : null
})

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) throw new AuthError('Não autenticado', 401)
  return user
}

export async function requireAdminSession() {
  const user = await requireUser()
  if (!user.admin) throw new AuthError('Acesso negado', 403)
  return user
}
