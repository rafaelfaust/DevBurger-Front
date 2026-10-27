import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth'
import { buildBranding } from '@/lib/branding'
import { errorResponse } from '@/lib/http'
import { normalizeBrMobile } from '@/lib/phone'
import { getCurrentTenant, StoreError } from '@/lib/tenant'
import { isWhatsAppConfigured, withWhatsApp, WhatsAppError } from '@/lib/whatsapp'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    await requireAdminSession()
    if (!isWhatsAppConfigured()) throw new StoreError('O envio por WhatsApp ainda não foi configurado na plataforma.', 503)
    const tenant = await getCurrentTenant()
    const { phone: raw } = z.object({ phone: z.string() }).parse(await request.json())
    const phone = normalizeBrMobile(raw)
    if (!phone) throw new StoreError('Informe um celular válido com DDD', 400)

    const storeName = buildBranding(tenant.slug, tenant.name, tenant.branding, tenant.segment).brandName
    await withWhatsApp(tenant.id, send =>
      send(phone, `Teste da ${storeName}: o WhatsApp está conectado e pronto para avisar os clientes sobre os pedidos. ✅`)
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error instanceof WhatsAppError ? new StoreError(error.message, 409) : error)
  }
}
