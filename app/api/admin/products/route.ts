import { NextResponse } from 'next/server'

import { AuthError, requireAdminSession } from '@/lib/auth'
import { createLocalProduct, LocalStoreError } from '@/lib/local-store'

export async function POST(request: Request) {
  try {
    await requireAdminSession()
    const body = await request.formData()
    const result = await createLocalProduct(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof LocalStoreError || error instanceof AuthError
            ? error.message
            : 'Falha ao criar produto'
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
