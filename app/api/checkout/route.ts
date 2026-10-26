import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { getTenantBranding } from '@/lib/branding-server'
import { paymentMethods } from '@/lib/payment-methods'
import { demoCheckout } from '@/lib/payments'
import { cancelUnpaidOrder, confirmOrderPayment, createOrder, StoreError } from '@/lib/store'

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1)
    .max(30),
  paymentMethod: z.enum(paymentMethods),
  changeFor: z.number().positive().max(10000).nullish()
})

export async function POST(request: Request) {
  try {
    const branding = await getTenantBranding()
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Entre na sua conta antes de finalizar o pedido' },
        { status: 401 }
      )
    }

    const payload = schema.parse(await request.json())
    const { order, lines, deliveryFee } = await createOrder(user, payload.items, {
      method: payload.paymentMethod,
      changeFor: payload.changeFor
    })
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      new URL(request.url).origin

    if (order.paymentMethod !== 'online') {
      return NextResponse.json({
        checkoutUrl: `${appUrl}/pagamento/recebido?pedido=${order.id}`
      })
    }

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
    // O Mercado Pago recusa retorno automático para endereços sem HTTPS (ex.: localhost),
    // e o webhook também não alcançaria a máquina local.
    const publicUrl = appUrl.startsWith('https://')
    const result = await new Preference(client).create({
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
        ...(publicUrl && {
          auto_return: 'approved',
          notification_url: `${appUrl}/api/webhooks/mercadopago`
        }),
        statement_descriptor: branding.statementDescriptor
      }
    }).catch(async (error: { message?: string; status?: number }) => {
      // O SDK rejeita com um objeto simples, não com Error.
      console.error('[checkout] Mercado Pago recusou a preferência', error?.status, error?.message)
      await cancelUnpaidOrder(order.id)
      throw new StoreError('Não foi possível abrir o pagamento online agora. Tente outra forma de pagamento.', 502)
    })

    const checkoutUrl = accessToken.startsWith('TEST-')
      ? result.sandbox_init_point
      : result.init_point

    if (!checkoutUrl) {
      await cancelUnpaidOrder(order.id)
      throw new StoreError('O Mercado Pago não devolveu o link de pagamento. Tente de novo.', 502)
    }
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
