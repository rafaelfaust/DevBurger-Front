import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { isPlatformHost, signInPlatform } from '@/lib/platform-auth'

const schema = z.object({ email: z.email('E-mail inválido'), password: z.string().min(1) })

export async function POST(request: Request) {
  if (!(await isPlatformHost())) return NextResponse.json({ message: 'Não encontrado' }, { status: 404 })
  try {
    await signInPlatform(schema.parse(await request.json()))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Não foi possível entrar')
  }
}
