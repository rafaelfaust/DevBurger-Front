import { cookies } from 'next/headers'

import { sessionCookieNames } from '@/lib/branding'
import type { User } from '@/lib/types'

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(sessionCookieNames.token)?.value ?? null
}

export async function getSessionUser(): Promise<User | null> {
  const value = (await cookies()).get(sessionCookieNames.user)?.value
  if (!value) return null

  try {
    return JSON.parse(decodeURIComponent(value)) as User
  } catch {
    return null
  }
}

export async function requireAdminSession() {
  const [token, user] = await Promise.all([getSessionToken(), getSessionUser()])

  if (!token || !user) {
    throw new AuthError('Não autenticado', 401)
  }

  if (!user.admin) {
    throw new AuthError('Acesso negado', 403)
  }

  return { token, user }
}
