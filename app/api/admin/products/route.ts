import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { apiRequest, ApiError } from '@/lib/api'
import { sessionCookieNames } from '@/lib/branding'

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get(sessionCookieNames.token)?.value
    if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    const body = await request.formData()
    const result = await apiRequest('products', { method: 'POST', body }, token)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof ApiError ? error.message : 'Falha ao criar produto' },
      { status: error instanceof ApiError ? error.status : 400 }
    )
  }
}
