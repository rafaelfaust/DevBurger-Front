import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { StoreError, updateStoreSettings } from '@/lib/store'

const schema = z.object({
  deliveryFee: z.number().min(0).max(1000),
  acceptsCash: z.boolean(),
  acceptsCardOnDelivery: z.boolean(),
  acceptsPixOnDelivery: z.boolean(),
  acceptsOnline: z.boolean()
})

export async function PUT(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    return NextResponse.json(await updateStoreSettings(payload))
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
