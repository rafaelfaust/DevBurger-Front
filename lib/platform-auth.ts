import { createHash, randomBytes } from 'node:crypto'

import { and, eq, gt } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'

import { AuthError } from '@/lib/auth'
import { normalizeHost } from '@/lib/branding'
import { getDb, schema } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

const COOKIE = 'platform_token'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export type PlatformAdmin = { id: string; name: string; email: string }

// O painel da plataforma só responde no domínio principal (nunca no subdomínio de uma loja).
// Sem PLATFORM_DOMAIN (desenvolvimento) qualquer host serve.
export async function isPlatformHost() {
  const platformDomain = normalizeHost(process.env.PLATFORM_DOMAIN ?? '')
  if (!platformDomain) return true

  const headerStore = await headers()
  const host = normalizeHost(headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? '')
  return host === platformDomain || host === 'localhost'
}

export async function signInPlatform(input: { email: string; password: string }) {
  const db = getDb()
  const [admin] = await db
    .select()
    .from(schema.platformAdmins)
    .where(eq(schema.platformAdmins.email, input.email.trim().toLowerCase()))

  if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
    throw new AuthError('E-mail ou senha inválidos', 401)
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.insert(schema.platformSessions).values({ id: hashToken(token), adminId: admin.id, expiresAt })
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/'
  })
}

export async function signOutPlatform() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (token) {
    await getDb().delete(schema.platformSessions).where(eq(schema.platformSessions.id, hashToken(token)))
  }
  cookieStore.delete(COOKIE)
}

export const getPlatformAdmin = cache(async (): Promise<PlatformAdmin | null> => {
  if (!(await isPlatformHost())) return null
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  const [row] = await getDb()
    .select({ id: schema.platformAdmins.id, name: schema.platformAdmins.name, email: schema.platformAdmins.email })
    .from(schema.platformSessions)
    .innerJoin(schema.platformAdmins, eq(schema.platformAdmins.id, schema.platformSessions.adminId))
    .where(and(eq(schema.platformSessions.id, hashToken(token)), gt(schema.platformSessions.expiresAt, new Date())))

  return row ?? null
})

export async function requirePlatformAdmin() {
  const admin = await getPlatformAdmin()
  if (!admin) throw new AuthError('Não autenticado', 401)
  return admin
}
