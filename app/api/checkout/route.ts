import { randomUUID } from 'node:crypto'

import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createBackendOrder, getProducts } from '@/lib/api'
import { getSessionUser } from '@/lib/auth'
import { getTenantBranding } from '@/lib/branding'

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

export async function POST(request: Request) {
  try {
    const branding = await getTenantBranding(request)
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
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
    const catalog = await getProducts()
    const trustedItems = payload.items.map(item => {
      const product = catalog.find(candidate => candidate.id === item.id)
      if (!product) throw new Error(`Produto ${item.id} não encontrado`)
      return { product, quantity: item.quantity }
    })

    const backendOrder = await createBackendOrder(
      trustedItems.map(({ product, quantity }) => ({
        id: product.id,
        quantity
      }))
    )
    const externalReference =
      backendOrder?._id ?? backendOrder?.id ?? randomUUID()
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      new URL(request.url).origin

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 8000 }
    })
    const preference = new Preference(client)
    const result = await preference.create({
      body: {
        items: [
          ...trustedItems.map(({ product, quantity }) => ({
            id: String(product.id),
            title: product.name,
            quantity,
            currency_id: 'BRL',
            unit_price: Number(product.price),
            picture_url: product.url.startsWith('http')
              ? product.url
              : `${appUrl}${product.url}`
          })),
          {
            id: 'delivery',
            title: 'Taxa de entrega',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 5
          }
        ],
        payer: {
          name: user.name,
          email: user.email
        },
        external_reference: String(externalReference),
        metadata: {
          order_id: String(externalReference),
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
    return NextResponse.json({ message }, { status: 400 })
  }
}
