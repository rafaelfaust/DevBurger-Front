import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { halfPricingRules } from '@/lib/product-options'
import { StoreError, updateStoreSettings } from '@/lib/store'

const schema = z.object({
  deliveryFee: z.number().min(0).max(1000),
  acceptsCash: z.boolean(),
  acceptsCardOnDelivery: z.boolean(),
  acceptsPixOnDelivery: z.boolean(),
  acceptsOnline: z.boolean(),
  // Opcional: se não vier, mantém a configuração atual.
  stockControl: z.boolean().optional(),
  pixKey: z.string().max(140).optional(),
  halfPricing: z.enum(halfPricingRules).optional()
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
