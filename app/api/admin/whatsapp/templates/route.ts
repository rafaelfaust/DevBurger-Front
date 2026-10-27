import { NextResponse } from 'next/server'
import { z } from 'zod'

import { errorResponse } from '@/lib/http'
import { updateWhatsAppTemplates } from '@/lib/whatsapp/admin'
import { notifiableStatuses } from '@/lib/whatsapp/templates'

const template = z.object({ enabled: z.boolean(), text: z.string().max(2000) })
const schema = z.object(Object.fromEntries(notifiableStatuses.map(status => [status, template.optional()])))

export async function PUT(request: Request) {
  try {
    await updateWhatsAppTemplates(schema.parse(await request.json()))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error, 'Não foi possível salvar as mensagens')
  }
}
