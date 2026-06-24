import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getSessionCookieNames } from '@/lib/branding-server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const sessionCookieNames = await getSessionCookieNames(request)
  cookieStore.delete(sessionCookieNames.token)
  cookieStore.delete(sessionCookieNames.user)
  return NextResponse.json({ ok: true })
}
