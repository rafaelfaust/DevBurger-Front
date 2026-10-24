import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { StoreError, updateAppearance } from '@/lib/store'

const text = (max: number) => z.string().trim().max(max).optional()
const color = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'Cor inválida')
  .optional()
// Só caminhos do próprio site ou endereços https.
const image = z
  .string()
  .trim()
  .max(500)
  .refine(value => !value || value.startsWith('/') || value.startsWith('https://'), {
    message: 'Use um caminho que comece com / ou um endereço https://'
  })
  .optional()

const schema = z.object({
  brandName: text(60),
  brandWordmarkLead: text(20),
  brandWordmarkTrail: text(20),
  statementDescriptor: text(13),
  siteDescription: text(160),
  footerTagline: text(120),
  homeEyebrow: text(60),
  homeTitlePrefix: text(60),
  homeTitleHighlight: text(30),
  homeTitleSuffix: text(60),
  homeCopy: text(240),
  homeHighlightTitle: text(60),
  productsTitle: text(60),
  productsDescription: text(160),
  theme: z
    .object({
      primary: color,
      primaryDark: color,
      accent: color,
      ink: color,
      paper: color,
      card: color
    })
    .optional(),
  assets: z
    .object({
      logoPath: image,
      faviconPath: image,
      homeHeroPath: image,
      catalogHeroPath: image,
      loginImagePath: image,
      registerImagePath: image
    })
    .optional()
})

// Campo vazio = voltar ao padrão, então não é guardado.
function dropEmpty<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, dropEmpty(item)])
      .filter(([, item]) =>
        typeof item === 'string' ? item !== '' : item !== undefined
      )
  ) as T
}

export async function PUT(request: Request) {
  try {
    const payload = dropEmpty(schema.parse(await request.json()))
    await updateAppearance(payload)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.issues[0]?.message ?? 'Dados inválidos')
        : error instanceof StoreError || error instanceof AuthError
          ? error.message
          : 'Dados inválidos'
    const status =
      error instanceof StoreError || error instanceof AuthError ? error.status : 400
    return NextResponse.json({ message }, { status })
  }
}
