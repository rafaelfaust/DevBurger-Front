import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createLocalUser, LocalStoreError } from '@/lib/local-store'

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(6)
})

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    await createLocalUser(payload)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    const status = error instanceof LocalStoreError ? error.status : 400
    return NextResponse.json(
      {
        message:
          status === 409
            ? 'Este e-mail já está cadastrado'
            : 'Não foi possível criar sua conta'
      },
      { status }
    )
  }
}
