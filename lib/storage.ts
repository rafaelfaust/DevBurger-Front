import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { AwsClient } from 'aws4fetch'

import { StoreError } from '@/lib/tenant'

// Limite abaixo dos 4,5 MB que a Vercel aceita no corpo de uma requisição.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

type ImageType = { ext: string; contentType: string }

// Confere o tipo pelos primeiros bytes do arquivo; nome e Content-Type vêm do navegador.
function detectImageType(bytes: Uint8Array): ImageType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', contentType: 'image/jpeg' }
  }
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') {
    return { ext: 'png', contentType: 'image/png' }
  }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return { ext: 'webp', contentType: 'image/webp' }
  }
  return null
}

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET?.trim()
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) return null

  // Um valor colado errado (com aspas ou o nome da variável) geraria links quebrados no banco.
  if (!/^https:\/\/[^\s"'=]+$/.test(publicUrl)) {
    console.error('[storage] R2_PUBLIC_URL inválida: use só o endereço, ex.: https://pub-xxxx.r2.dev')
    throw new StoreError('O envio de imagens está com a configuração inválida', 503)
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl }
}

async function putR2(
  config: NonNullable<ReturnType<typeof r2Config>>,
  key: string,
  body: Uint8Array<ArrayBuffer>,
  contentType: string
) {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto'
  })
  const response = await client.fetch(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`,
    {
      method: 'PUT',
      body,
      headers: {
        'Content-Type': contentType,
        // O nome do arquivo é único, então pode ficar em cache para sempre.
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  )

  if (!response.ok) {
    console.error('[storage] R2 respondeu', response.status, await response.text())
    throw new StoreError('Não foi possível enviar a imagem agora. Tente de novo.', 502)
  }

  return `${config.publicUrl}/${key}`
}

// Sem R2 configurado, em desenvolvimento grava em public/uploads.
async function putLocal(key: string, body: Uint8Array) {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new StoreError('O envio de imagens ainda não foi configurado neste ambiente', 503)
  }

  const target = path.join(process.cwd(), 'public', 'uploads', key)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, body)
  return `/uploads/${key}`
}

export async function uploadImage(file: File, tenantSlug: string, folder: 'products' | 'branding') {
  if (!file.size) throw new StoreError('Escolha uma imagem', 400)
  if (file.size > MAX_IMAGE_BYTES) {
    throw new StoreError('A imagem precisa ter no máximo 4 MB', 413)
  }

  const body = new Uint8Array(await file.arrayBuffer())
  const type = detectImageType(body)
  if (!type) throw new StoreError('Envie uma imagem JPG, PNG ou WebP', 415)

  const key = `${tenantSlug}/${folder}/${randomUUID()}.${type.ext}`
  const config = r2Config()
  return config ? putR2(config, key, body, type.contentType) : putLocal(key, body)
}
