import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { requirePlatformAdmin } from '@/lib/platform-auth'
import { resetOwnerPassword } from '@/lib/platform'

const schema = z.object({ userId: z.uuid() })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin()
    const { id } = await params
    const { userId } = schema.parse(await request.json())
    return NextResponse.json(await resetOwnerPassword(z.uuid().parse(id), userId))
  } catch (error) {
    return errorResponse(error)
  }
}
