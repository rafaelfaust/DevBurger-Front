import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionCookieNames } from '@/lib/branding-server'
import { createLocalSession, LocalStoreError } from '@/lib/local-store'

const schema = z.object({
  email: z.email(),
  password: z.string().min(6)
})

export async function POST(request: Request) {
  try {
    const credentials = schema.parse(await request.json())
    const { token, user } = await createLocalSession(credentials)
    const cookieStore = await cookies()
    const sessionCookieNames = await getSessionCookieNames(request)

    cookieStore.set(sessionCookieNames.token, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    cookieStore.set(sessionCookieNames.user, encodeURIComponent(JSON.stringify(user)), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return NextResponse.json({ user })
  } catch (error) {
    const status = error instanceof LocalStoreError ? error.status : 400
    return NextResponse.json(
      { message: status === 401 ? 'E-mail ou senha inválidos' : 'Não foi possível entrar' },
      { status }
    )
  }
}
