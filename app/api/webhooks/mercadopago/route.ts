import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator
} from 'mercadopago'
import { NextResponse } from 'next/server'

import { apiRequest } from '@/lib/api'

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
    const serviceToken =
      process.env.APP_SERVICE_TOKEN ?? process.env.DEV_BURGER_SERVICE_TOKEN
    if (serviceToken) {
      await apiRequest(
        `orders/${payment.external_reference}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: 'Pedido realizado',
            payment_id: String(payment.id),
            payment_status: payment.status
          })
        },
        serviceToken
      )
    }
  }

  return NextResponse.json({ received: true })
}
