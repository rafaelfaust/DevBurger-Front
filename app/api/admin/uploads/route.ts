import { NextResponse } from 'next/server'

import { AuthError, requireAdminSession } from '@/lib/auth'
import { uploadImage } from '@/lib/storage'
import { getCurrentTenant, StoreError } from '@/lib/tenant'

// Imagens da marca (logo, banners). Fotos de produto sobem junto com o produto.
export async function POST(request: Request) {
  try {
    await requireAdminSession()
    const tenant = await getCurrentTenant()
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) throw new StoreError('Escolha uma imagem', 400)

    const url = await uploadImage(file, tenant.slug, 'branding')
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    const known = error instanceof StoreError || error instanceof AuthError
    return NextResponse.json(
      { message: known ? error.message : 'Falha ao enviar a imagem' },
      { status: known ? error.status : 400 }
    )
  }
}
