import { NextResponse } from 'next/server'
import { z } from 'zod'

import { apiRequest, ApiError } from '@/lib/api'
import { AuthError, requireAdminSession } from '@/lib/auth'

const schema = z.object({ status: z.string().min(2) })

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token } = await requireAdminSession()
    const { id } = await params
    const payload = schema.parse(await request.json())
    const result = await apiRequest(`orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }, token)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof ApiError || error instanceof AuthError
            ? error.message
            : 'Dados inválidos'
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
