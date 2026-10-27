import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { deleteProduct, setProductActive, updateProduct } from '@/lib/store'

type Params = { params: Promise<{ id: string }> }
const productId = z.coerce.number().int().positive()

// Edição completa (multipart, foto opcional).
export async function PUT(request: Request, { params }: Params) {
  try {
    const id = productId.parse((await params).id)
    return NextResponse.json(await updateProduct(id, await request.formData()))
  } catch (error) {
    return errorResponse(error, 'Não foi possível salvar o produto')
  }
}

// Pausar ou reativar no cardápio.
export async function PATCH(request: Request, { params }: Params) {
  try {
    const id = productId.parse((await params).id)
    const { active } = z.object({ active: z.boolean() }).parse(await request.json())
    await setProductActive(id, active)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await deleteProduct(productId.parse((await params).id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Não foi possível excluir o produto')
  }
}
