import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { deleteCategory, moveCategory, renameCategory } from '@/lib/store'

type Params = { params: Promise<{ id: string }> }
const categoryId = z.coerce.number().int().positive()

const schema = z.union([
  z.object({ name: z.string() }),
  z.object({ move: z.enum(['up', 'down']) })
])

export async function PATCH(request: Request, { params }: Params) {
  try {
    const id = categoryId.parse((await params).id)
    const body = schema.parse(await request.json())
    if ('name' in body) await renameCategory(id, body.name)
    else await moveCategory(id, body.move)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await deleteCategory(categoryId.parse((await params).id))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Não foi possível excluir a categoria')
  }
}
