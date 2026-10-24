import { NextResponse } from 'next/server'
import { z } from 'zod'

import { signIn } from '@/lib/auth'
import { StoreError } from '@/lib/store'

const schema = z.object({
  email: z.email(),
  password: z.string().min(6)
})

export async function POST(request: Request) {
  try {
    const credentials = schema.parse(await request.json())
    const user = await signIn(credentials)
    return NextResponse.json({ user })
  } catch (error) {
    const status = error instanceof StoreError ? error.status : 400
    return NextResponse.json(
      { message: status === 401 ? 'E-mail ou senha inválidos' : 'Não foi possível entrar' },
      { status }
    )
  }
}
