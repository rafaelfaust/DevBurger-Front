import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError, requireAdminSession } from '@/lib/auth'
import { LocalStoreError, updateLocalOrderStatus } from '@/lib/local-store'

const schema = z.object({ status: z.string().min(2) })

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = await params
    const payload = schema.parse(await request.json())
    const result = await updateLocalOrderStatus(id, payload.status)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof LocalStoreError || error instanceof AuthError
            ? error.message
            : 'Dados inválidos'
      },
      {
        status:
          error instanceof LocalStoreError || error instanceof AuthError
            ? error.status
            : 400
      }
    )
  }
}
