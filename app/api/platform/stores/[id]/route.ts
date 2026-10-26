import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { requirePlatformAdmin } from '@/lib/platform-auth'
import { updateStore } from '@/lib/platform'
import { segments } from '@/lib/segments'

const schema = z.object({
  active: z.boolean().optional(),
  segment: z.enum(segments).optional()
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params
    await updateStore(z.uuid().parse(id), schema.parse(await request.json()))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
