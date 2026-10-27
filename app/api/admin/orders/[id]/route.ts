import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { orderStatuses } from '@/lib/order-status'
import { StoreError, updateOrderStatus } from '@/lib/store'

const schema = z.object({ status: z.enum(orderStatuses) })

// Avisos de WhatsApp saem em segundo plano (after) depois da resposta.
export const maxDuration = 300

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = schema.parse(await request.json())
    const result = await updateOrderStatus(id, payload.status)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof StoreError || error instanceof AuthError
            ? error.message
            : 'Dados inválidos'
      },
      {
        status:
          error instanceof StoreError || error instanceof AuthError
            ? error.status
            : 400
      }
    )
  }
}
