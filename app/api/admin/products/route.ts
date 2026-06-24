import { NextResponse } from 'next/server'

import { apiRequest, ApiError } from '@/lib/api'
import { AuthError, requireAdminSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token } = await requireAdminSession()
    const body = await request.formData()
    const result = await apiRequest('products', { method: 'POST', body }, token)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof ApiError || error instanceof AuthError
            ? error.message
            : 'Falha ao criar produto'
      },
      {
        status:
          error instanceof ApiError || error instanceof AuthError
            ? error.status
            : 400
      }
    )
  }
}
