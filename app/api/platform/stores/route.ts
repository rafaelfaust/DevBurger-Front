import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { requirePlatformAdmin } from '@/lib/platform-auth'
import { createStore } from '@/lib/platform'
import { segments } from '@/lib/segments'

const schema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da loja').max(60),
  slug: z.string().trim().min(3, 'Informe o endereço da loja').max(40),
  segment: z.enum(segments, 'Escolha o tipo de loja'),
  ownerName: z.string().trim().min(2, 'Informe o nome do dono').max(80),
  ownerEmail: z.email('E-mail do dono inválido')
})

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin()
    return NextResponse.json(await createStore(schema.parse(await request.json())), { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Não foi possível criar a loja')
  }
}
