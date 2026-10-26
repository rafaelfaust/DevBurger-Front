import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { requirePlatformAdmin } from '@/lib/platform-auth'
import { addStoreDomain, removeStoreDomain } from '@/lib/platform'

const schema = z.object({ host: z.string().trim().min(4).max(253) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params
    const host = await addStoreDomain(z.uuid().parse(id), schema.parse(await request.json()).host)
    return NextResponse.json({ host }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params
    await removeStoreDomain(z.uuid().parse(id), schema.parse(await request.json()).host)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
