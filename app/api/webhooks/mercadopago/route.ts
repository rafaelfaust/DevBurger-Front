import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator
} from 'mercadopago'
import { NextResponse } from 'next/server'

import { markLocalOrderPaid } from '@/lib/local-store'

type Notification = {
  type?: string
  data?: { id?: string }
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!accessToken || !secret) {
    return NextResponse.json({ message: 'Webhook não configurado' }, { status: 503 })
  }

  const url = new URL(request.url)
  const body = (await request.json().catch(() => ({}))) as Notification
  const dataId = url.searchParams.get('data.id') ?? body.data?.id ?? ''

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get('x-signature') ?? '',
      xRequestId: request.headers.get('x-request-id') ?? '',
      dataId,
      secret
    })
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ message: 'Assinatura inválida' }, { status: 401 })
    }
    throw error
  }

  if (body.type !== 'payment' || !dataId) {
    return NextResponse.json({ received: true })
  }

  const client = new MercadoPagoConfig({ accessToken })
  const payment = await new Payment(client).get({ id: dataId })

  if (payment.status === 'approved' && payment.external_reference) {
    await markLocalOrderPaid({
      id: String(payment.external_reference),
      paymentId: String(payment.id),
      paymentStatus: payment.status
    })
  }

  return NextResponse.json({ received: true })
}
