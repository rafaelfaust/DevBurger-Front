import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { sessionCookieNames } from '@/lib/branding'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookieNames.token)
  cookieStore.delete(sessionCookieNames.user)
  return NextResponse.json({ ok: true })
}
