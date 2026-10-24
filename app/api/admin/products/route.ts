import { NextResponse } from 'next/server'

import { AuthError } from '@/lib/auth'
import { createProduct, StoreError } from '@/lib/store'

export async function POST(request: Request) {
  try {
    const result = await createProduct(await request.formData())
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof StoreError || error instanceof AuthError
            ? error.message
            : 'Falha ao criar produto'
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
