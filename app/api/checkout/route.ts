import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { getTenantBranding } from '@/lib/branding-server'
import { confirmOrderPayment, createOrder, StoreError } from '@/lib/store'

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(30)
})

// Checkout falso para testes: local ou deploy de preview da Vercel. Nunca em produção.
const demoCheckout =
  process.env.ALLOW_DEMO_CHECKOUT === 'true' &&
  (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview')

export async function POST(request: Request) {
  try {
    const branding = await getTenantBranding(request)
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken && !demoCheckout) {
      return NextResponse.json(
        { message: 'Mercado Pago ainda não foi configurado' },
        { status: 503 }
      )
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Entre na sua conta antes de pagar' },
        { status: 401 }
      )
    }

    const payload = schema.parse(await request.json())
    const { order, lines, deliveryFee } = await createOrder(user, payload.items)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      new URL(request.url).origin

    if (demoCheckout) {
      await confirmOrderPayment({
        orderId: order.id,
        paymentId: `demo-${Date.now()}`,
        paymentStatus: 'approved',
        amountPaid: order.totalCents / 100
      })

      return NextResponse.json({
        checkoutUrl: `${appUrl}/pagamento/sucesso?pedido=${order.id}`,
        preferenceId: `demo-${order.id}`
      })
    }

    if (!accessToken) {
      throw new Error('Mercado Pago ainda não foi configurado')
    }

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 8000 }
    })
    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: [
          ...lines.map(({ product, quantity }) => ({
            id: String(product.id),
            title: product.name,
            quantity,
            currency_id: 'BRL',
            unit_price: product.price,
            picture_url: product.url.startsWith('http')
              ? product.url
              : `${appUrl}${product.url}`
          })),
          ...(deliveryFee > 0
            ? [
                {
                  id: 'delivery',
                  title: 'Taxa de entrega',
                  quantity: 1,
                  currency_id: 'BRL',
                  unit_price: deliveryFee
                }
              ]
            : [])
        ],
        payer: {
          name: user.name,
          email: user.email
        },
        external_reference: order.id,
        metadata: {
          order_id: order.id,
          customer_email: user.email
        },
        back_urls: {
          success: `${appUrl}/pagamento/sucesso`,
          pending: `${appUrl}/pagamento/pendente`,
          failure: `${appUrl}/pagamento/falha`
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: branding.statementDescriptor
      }
    })

    const checkoutUrl = accessToken.startsWith('TEST-')
      ? result.sandbox_init_point
      : result.init_point

    if (!checkoutUrl) throw new Error('Mercado Pago não retornou o checkout')
    return NextResponse.json({ checkoutUrl, preferenceId: result.id })
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? 'Carrinho inválido'
        : error instanceof Error
          ? error.message
          : 'Falha ao iniciar pagamento'
    const status = error instanceof StoreError ? error.status : 400
    return NextResponse.json({ message }, { status })
  }
}
