import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiRequest, ApiError } from '@/lib/api'
import { sessionCookieNames } from '@/lib/branding'

const schema = z.object({ status: z.string().min(2) })

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get(sessionCookieNames.token)?.value
    if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    const { id } = await params
    const payload = schema.parse(await request.json())
    const result = await apiRequest(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, token)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof ApiError ? error.message : 'Dados inválidos' },
      { status: error instanceof ApiError ? error.status : 400 }
    )
  }
}
