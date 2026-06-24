import { cookies } from 'next/headers'

import { sessionCookieNames } from '@/lib/branding'
import type { User } from '@/lib/types'

export async function getSessionUser(): Promise<User | null> {
  const value = (await cookies()).get(sessionCookieNames.user)?.value
  if (!value) return null

  try {
    return JSON.parse(decodeURIComponent(value)) as User
  } catch {
    return null
  }
}
