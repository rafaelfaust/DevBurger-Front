import { after, NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/auth'
import { errorResponse } from '@/lib/http'
import { getCurrentTenant, StoreError } from '@/lib/tenant'
import {
  getWhatsAppSession,
  isWhatsAppConfigured,
  runPairing,
  startPairing,
  stopWhatsAppSession,
  WhatsAppError
} from '@/lib/whatsapp'

// O pareamento roda em segundo plano (after) enquanto o QR code fica na tela.
export const maxDuration = 60

async function tenantId() {
  await requireAdminSession()
  if (!isWhatsAppConfigured()) throw new StoreError('O envio por WhatsApp ainda não foi configurado na plataforma.', 503)
  return (await getCurrentTenant()).id
}

const whatsappError = (error: unknown) =>
  errorResponse(error instanceof WhatsAppError ? new StoreError(error.message, 409) : error)

// Situação da conexão (a tela consulta a cada poucos segundos enquanto mostra o QR code)
export async function GET() {
  try {
    return NextResponse.json(await getWhatsAppSession(await tenantId()))
  } catch (error) {
    return whatsappError(error)
  }
}

// Gera o QR code para conectar o WhatsApp da loja
export async function POST() {
  try {
    const id = await tenantId()
    await startPairing(id)
    after(() => runPairing(id))
    return NextResponse.json(await getWhatsAppSession(id))
  } catch (error) {
    return whatsappError(error)
  }
}

// Desconecta o número (também remove o aparelho no celular)
export async function DELETE() {
  try {
    return NextResponse.json(await stopWhatsAppSession(await tenantId()))
  } catch (error) {
    return whatsappError(error)
  }
}
