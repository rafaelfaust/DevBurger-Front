// Sessão do Baileys no Postgres (tabela whatsapp_auth_keys), cifrada com AES-256-GCM.
// Mesmo formato do useMultiFileAuthState, mas sem arquivos: roda em funções serverless.
// Portado do Doutor Agenda (src/lib/whatsapp/auth-store.ts), com consultas pelo Drizzle.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import {
  type AuthenticationCreds,
  type AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  type SignalDataTypeMap
} from '@whiskeysockets/baileys'
import { and, eq, inArray, sql } from 'drizzle-orm'

import { getDb, schema } from '@/lib/db'

const getEncryptionKey = () => {
  const key = Buffer.from(process.env.WHATSAPP_SESSION_ENCRYPTION_KEY ?? '', 'base64')
  if (key.length !== 32) {
    throw new Error('WHATSAPP_SESSION_ENCRYPTION_KEY precisa ter 32 bytes em base64.')
  }
  return key
}

export const hasEncryptionKey = () => {
  try {
    getEncryptionKey()
    return true
  } catch {
    return false
  }
}

// "iv.tag.conteúdo" em base64
const encrypt = (text: string) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const content = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), content].map(part => part.toString('base64')).join('.')
}

const decrypt = (value: string) => {
  const [iv, tag, content] = value.split('.').map(part => Buffer.from(part, 'base64'))
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(content), decipher.final()]).toString('utf8')
}

const keys = schema.whatsappAuthKeys

const readKey = async (tenantId: string, key: string) => {
  const [row] = await getDb()
    .select({ value: keys.value })
    .from(keys)
    .where(and(eq(keys.tenantId, tenantId), eq(keys.key, key)))
  if (!row) return null
  return JSON.parse(decrypt(row.value), BufferJSON.reviver)
}

const writeKeys = async (tenantId: string, entries: [string, unknown][]) => {
  if (!entries.length) return
  await getDb()
    .insert(keys)
    .values(
      entries.map(([key, data]) => ({
        tenantId,
        key,
        value: encrypt(JSON.stringify(data, BufferJSON.replacer)),
        updatedAt: new Date()
      }))
    )
    .onConflictDoUpdate({
      target: [keys.tenantId, keys.key],
      set: { value: sql`excluded.value`, updatedAt: new Date() }
    })
}

const removeKeys = async (tenantId: string, ids: string[]) => {
  if (!ids.length) return
  await getDb()
    .delete(keys)
    .where(and(eq(keys.tenantId, tenantId), inArray(keys.key, ids)))
}

export const hasSavedSession = async (tenantId: string) => {
  const [row] = await getDb()
    .select({ key: keys.key })
    .from(keys)
    .where(and(eq(keys.tenantId, tenantId), eq(keys.key, 'creds')))
  return Boolean(row)
}

// flush(): espera as gravações pendentes antes de fechar a conexão
export const loadDatabaseAuthState = async (tenantId: string) => {
  const creds: AuthenticationCreds = (await readKey(tenantId, 'creds')) ?? initAuthCreds()
  const pending = new Set<Promise<unknown>>()
  const track = <T>(promise: Promise<T>) => {
    pending.add(promise)
    promise.finally(() => pending.delete(promise)).catch(() => {})
    return promise
  }

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
        const data: { [id: string]: SignalDataTypeMap[T] } = {}
        await Promise.all(
          ids.map(async id => {
            let value = await readKey(tenantId, `${type}-${id}`)
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value)
            }
            data[id] = value
          })
        )
        return data
      },
      set: async data => {
        const toWrite: [string, unknown][] = []
        const toRemove: string[] = []
        for (const category in data) {
          const items = data[category as keyof SignalDataTypeMap] ?? {}
          for (const id in items) {
            const value = items[id]
            if (value) toWrite.push([`${category}-${id}`, value])
            else toRemove.push(`${category}-${id}`)
          }
        }
        await track(Promise.all([writeKeys(tenantId, toWrite), removeKeys(tenantId, toRemove)]))
      }
    }
  }

  return {
    state,
    saveCreds: () => track(writeKeys(tenantId, [['creds', creds]])),
    flush: async () => {
      while (pending.size) {
        await Promise.allSettled([...pending])
      }
    }
  }
}

// Apaga a sessão (desconectou ou foi desconectado pelo celular)
export const clearAuthState = (tenantId: string) =>
  getDb().delete(keys).where(eq(keys.tenantId, tenantId))
