import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { createCategory } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const { name } = z.object({ name: z.string() }).parse(await request.json())
    return NextResponse.json(await createCategory(name), { status: 201 })
  } catch (error) {
    return errorResponse(error, 'Não foi possível criar a categoria')
  }
}
