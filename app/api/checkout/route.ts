import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/auth'
import { getTenantBranding } from '@/lib/branding-server'
import { paymentMethods } from '@/lib/payment-methods'
import { demoCheckout } from '@/lib/payments'
import { LIMITS } from '@/lib/product-options'
import {
  cancelUnpaidOrder,
  confirmOrderPayment,
  createOrder,
  PAYMENT_WINDOW_MINUTES,
  StoreError
} from '@/lib/store'

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
        // Escolhas do item; o preço é recalculado no servidor.
        size: z.string().max(40).optional(),
        flavors: z.array(z.number().int().positive()).max(LIMITS.flavors).optional(),
        options: z.array(z.string().max(40)).max(LIMITS.groups * LIMITS.itemsPerGroup).optional(),
        note: z.string().max(LIMITS.note).optional()
      })
    )
    .min(1)
    .max(30),
  paymentMethod: z.enum(paymentMethods),
  changeFor: z.number().positive().max(10000).nullish(),
  // Sem cadastro: nome e celular bastam para pedir.
  customer: z.object({
    name: z.string().trim().min(2, 'Informe seu nome').max(80),
    phone: z.string().trim().min(10, 'Informe seu celular com DDD').max(20),
    whatsappOptIn: z.boolean()
  }, { error: 'Informe seu nome e celular' })
})

// Avisos de WhatsApp saem em segundo plano (after) depois da resposta.
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const branding = await getTenantBranding()
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN

    // Opcional: com conta logada o pedido entra no histórico dela.
    const user = await getSessionUser()
    const payload = schema.parse(await request.json())
    const { order, lines, deliveryFee } = await createOrder(
      { ...payload.customer, sessionUser: user },
      payload.items,
      { method: payload.paymentMethod, changeFor: payload.changeFor }
    )
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
    const paymentDeadline = new Date(order.createdAt.getTime() + PAYMENT_WINDOW_MINUTES * 60_000)
    const result = await new Preference(client).create({
      body: {
        items: [
          ...lines.map(line => ({
            id: String(line.id),
            title: line.name.slice(0, 250),
            quantity: line.quantity,
            currency_id: 'BRL',
            unit_price: line.unitPrice,
            picture_url: line.url.startsWith('http') ? line.url : `${appUrl}${line.url}`
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
        // Só o nome: cliente sem cadastro não tem e-mail, e o Mercado Pago pede o resto.
        payer: { name: order.customerName ?? undefined },
        external_reference: order.id,
        metadata: { order_id: order.id },
        back_urls: {
          success: `${appUrl}/pagamento/sucesso`,
          pending: `${appUrl}/pagamento/pendente`,
          failure: `${appUrl}/pagamento/falha`
        },
        ...(publicUrl && {
          auto_return: 'approved',
          notification_url: `${appUrl}/api/webhooks/mercadopago`
        }),
        // O link vale o mesmo prazo da reserva do pedido (depois disso ele é cancelado).
        expires: true,
        expiration_date_from: order.createdAt.toISOString(),
        expiration_date_to: paymentDeadline.toISOString(),
        date_of_expiration: paymentDeadline.toISOString(),
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
        ? error.issues[0]?.path[0] === 'customer'
          ? error.issues[0].message
          : 'Carrinho inválido'
        : error instanceof Error
          ? error.message
          : 'Falha ao iniciar pagamento'
    const status = error instanceof StoreError ? error.status : 400
    return NextResponse.json({ message }, { status })
  }
}
