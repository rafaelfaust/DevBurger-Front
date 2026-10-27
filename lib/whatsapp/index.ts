// WhatsApp da loja conectado por QR code (Baileys), rodando dentro do próprio Next.
// Só envia: a conexão abre para parear ou para enviar e fecha em seguida. As credenciais
// ficam cifradas no Postgres (auth-store.ts) e a situação em whatsapp_connections.
// Portado do Doutor Agenda (src/lib/whatsapp/index.ts).
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket
} from '@whiskeysockets/baileys'
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'
import pino from 'pino'
import QRCode from 'qrcode'

import { getDb, schema } from '@/lib/db'

import { clearAuthState, hasEncryptionKey, hasSavedSession, loadDatabaseAuthState } from './auth-store'

export type WhatsAppStatus = 'connecting' | 'qr' | 'connected' | 'disconnected'

export interface WhatsAppSession {
  status: WhatsAppStatus
  qr: string | null // QR code em data URL, enquanto status = "qr"
  phone: string | null // número conectado
}

export class WhatsAppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message)
  }
}

// Tempo para ler o QR code (o pareamento roda em segundo plano, dentro do maxDuration)
export const PAIRING_TIMEOUT_MS = 240_000
const CONNECT_TIMEOUT_MS = 30_000
const ACK_TIMEOUT_MS = 10_000
// Intervalo entre mensagens do mesmo número, para não parecer disparo em massa
const MIN_DELAY_MS = 3000
const MAX_DELAY_MS = 6000

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL ?? 'error' })

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const isWhatsAppConfigured = () => hasEncryptionKey()

const connections = schema.whatsappConnections

// Datas sempre pelo relógio do banco (now()), para a trava valer entre funções
const setConnection = (
  tenantId: string,
  fields: Partial<{ status: WhatsAppStatus; qr: string | null; phone: string | null }>
) =>
  getDb()
    .insert(connections)
    .values({ tenantId, ...fields, updatedAt: sql`now()` })
    .onConflictDoUpdate({ target: connections.tenantId, set: { ...fields, updatedAt: sql`now()` } })

const tryLock = async (tenantId: string, leaseMs: number) => {
  const db = getDb()
  await db.insert(connections).values({ tenantId }).onConflictDoNothing()
  const locked = await db
    .update(connections)
    .set({ lockedUntil: sql`now() + make_interval(secs => ${leaseMs / 1000})` })
    .where(
      and(
        eq(connections.tenantId, tenantId),
        or(isNull(connections.lockedUntil), lt(connections.lockedUntil, sql`now()`))
      )
    )
    .returning({ tenantId: connections.tenantId })
  return locked.length === 1
}

// Uma conexão por vez por loja (duas conexões com a mesma sessão se derrubam)
const waitForLock = async (tenantId: string, leaseMs: number, waitMs: number) => {
  const deadline = Date.now() + waitMs
  while (!(await tryLock(tenantId, leaseMs))) {
    if (Date.now() > deadline) {
      throw new WhatsAppError('busy', 'O WhatsApp da loja está ocupado. Tente de novo em instantes.')
    }
    await sleep(2000)
  }
}

const releaseLock = (tenantId: string) =>
  getDb()
    .update(connections)
    .set({ lockedUntil: null })
    .where(eq(connections.tenantId, tenantId))
    .catch(() => {})

export const getWhatsAppSession = async (tenantId: string): Promise<WhatsAppSession> => {
  const [row] = await getDb()
    .select({
      status: connections.status,
      qr: connections.qr,
      phone: connections.phone,
      stale: sql<boolean>`${connections.updatedAt} < now() - interval '6 minutes'`
    })
    .from(connections)
    .where(eq(connections.tenantId, tenantId))
  // Pareamento que parou no meio (a função terminou): volta a pedir para conectar
  if (!row || (row.stale && row.status !== 'connected')) {
    return { status: 'disconnected', qr: null, phone: null }
  }
  return {
    status: row.status,
    qr: row.status === 'qr' ? row.qr : null,
    phone: row.status === 'connected' ? row.phone : null
  }
}

type Auth = Awaited<ReturnType<typeof loadDatabaseAuthState>>

// Abre o socket com a sessão salva. Resolve quando conecta; rejeita ao fechar.
// Sem onQr, pedir QR code significa que a sessão não vale mais.
const connectOnce = async (
  tenantId: string,
  { timeoutMs, onQr }: { timeoutMs: number; onQr?: (qr: string) => Promise<unknown> }
) => {
  const auth = await loadDatabaseAuthState(tenantId)
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))
  const sock = makeWASocket({
    auth: auth.state,
    version,
    logger,
    browser: Browsers.ubuntu('Delivery'),
    markOnlineOnConnect: false,
    // Não baixa o histórico completo (só envia). A sincronização inicial continua
    // ligada: o Baileys 7 precisa dela para mapear os contatos (LID).
    syncFullHistory: false
  })
  sock.ev.on('creds.update', auth.saveCreds)

  return new Promise<{ sock: WASocket; auth: Auth }>((resolve, reject) => {
    const fail = (error: WhatsAppError) => {
      clearTimeout(timer)
      sock.end(undefined)
      reject(error)
    }
    const timer = setTimeout(
      () => fail(new WhatsAppError('timeout', 'O WhatsApp demorou para responder. Tente de novo.')),
      timeoutMs
    )
    sock.ev.on('connection.update', update => {
      if (update.qr) {
        if (onQr) {
          onQr(update.qr).catch(() => {})
        } else {
          fail(new WhatsAppError('not_connected', 'O WhatsApp da loja não está conectado.'))
        }
      }
      if (update.connection === 'open') {
        clearTimeout(timer)
        resolve({ sock, auth })
      }
      if (update.connection === 'close') {
        const statusCode = (update.lastDisconnect?.error as { output?: { statusCode?: number } })?.output
          ?.statusCode
        fail(
          new WhatsAppError(
            statusCode === DisconnectReason.loggedOut ? 'logged_out' : 'closed',
            'A conexão com o WhatsApp caiu. Tente de novo.',
            statusCode
          )
        )
      }
    })
  })
}

// Fecha sem desconectar o aparelho (logout só ao desconectar pela tela)
const closeSocket = async ({ sock, auth }: { sock: WASocket; auth: Auth }) => {
  await auth.flush().catch(() => {})
  sock.end(undefined)
  await auth.flush().catch(() => {})
}

// reason: queda automática (não pedida pela tela) vai para o log
const markLoggedOut = async (tenantId: string, reason?: string) => {
  await clearAuthState(tenantId)
  await setConnection(tenantId, { status: 'disconnected', qr: null, phone: null })
  if (reason) console.warn(`[whatsapp] loja ${tenantId} desconectada: ${reason}`)
}

const phoneFromSocket = (sock: WASocket) => sock.user?.id?.split(':')[0]?.split('@')[0] ?? null

// Começa a parear do zero: a tela passa a mostrar "Conectando…" até o QR aparecer.
// Depois chame runPairing em segundo plano (after), que libera a trava no final.
export const startPairing = async (tenantId: string) => {
  if (!(await tryLock(tenantId, PAIRING_TIMEOUT_MS + 60_000))) {
    throw new WhatsAppError('busy', 'O WhatsApp da loja está ocupado. Tente de novo em instantes.')
  }
  await clearAuthState(tenantId)
  await setConnection(tenantId, { status: 'connecting', qr: null, phone: null })
}

export const runPairing = async (tenantId: string) => {
  const deadline = Date.now() + PAIRING_TIMEOUT_MS
  try {
    // Depois de ler o QR o WhatsApp pede para reconectar (restartRequired): é normal
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const connection = await connectOnce(tenantId, {
          timeoutMs: Math.max(deadline - Date.now(), 5000),
          onQr: async qr =>
            setConnection(tenantId, {
              status: 'qr',
              qr: await QRCode.toDataURL(qr, { margin: 1, width: 320 })
            })
        })
        await setConnection(tenantId, { status: 'connected', qr: null, phone: phoneFromSocket(connection.sock) })
        // Deixa a sincronização inicial terminar antes de fechar
        await sleep(10_000)
        await closeSocket(connection)
        return
      } catch (error) {
        if (error instanceof WhatsAppError && error.statusCode === DisconnectReason.restartRequired) {
          continue
        }
        throw error
      }
    }
    throw new WhatsAppError('closed', 'Não foi possível parear.')
  } catch {
    // QR code expirou ou a conexão caiu antes de parear
    await markLoggedOut(tenantId).catch(() => {})
  } finally {
    await releaseLock(tenantId)
  }
}

// Desconecta o aparelho no celular e apaga a sessão
export const stopWhatsAppSession = async (tenantId: string): Promise<WhatsAppSession> => {
  await waitForLock(tenantId, 60_000, 30_000)
  try {
    if (await hasSavedSession(tenantId)) {
      const connection = await connectOnce(tenantId, { timeoutMs: CONNECT_TIMEOUT_MS }).catch(() => null)
      if (connection) {
        await connection.sock.logout().catch(() => {})
        await connection.auth.flush().catch(() => {})
      }
    }
    await markLoggedOut(tenantId)
  } finally {
    await releaseLock(tenantId)
  }
  return { status: 'disconnected', qr: null, phone: null }
}

// Espera o servidor do WhatsApp receber a mensagem antes de fechar a conexão
const waitForAck = (sock: WASocket, messageId: string) =>
  new Promise<void>(resolve => {
    const timer = setTimeout(done, ACK_TIMEOUT_MS)
    function done() {
      clearTimeout(timer)
      sock.ev.off('messages.update', onUpdate)
      resolve()
    }
    function onUpdate(updates: { key: { id?: string | null }; update: { status?: number | null } }[]) {
      if (updates.some(item => item.key.id === messageId && (item.update.status ?? 0) >= 2)) done()
    }
    sock.ev.on('messages.update', onUpdate)
  })

// phone: só dígitos com DDI (5511987654321)
export type SendWhatsApp = (phone: string, text: string) => Promise<void>

// Abre a conexão da loja, entrega `send` (um envio por vez, com intervalo) e fecha.
// leaseMs: quanto tempo a conexão pode ficar aberta.
export const withWhatsApp = async <T>(
  tenantId: string,
  run: (send: SendWhatsApp) => Promise<T>,
  { leaseMs = 120_000, waitMs = 60_000 }: { leaseMs?: number; waitMs?: number } = {}
) => {
  const session = await getWhatsAppSession(tenantId)
  if (session.status !== 'connected' || !(await hasSavedSession(tenantId))) {
    throw new WhatsAppError('not_connected', 'O WhatsApp da loja não está conectado.')
  }
  await waitForLock(tenantId, leaseMs, waitMs)
  try {
    let connection: Awaited<ReturnType<typeof connectOnce>> | null = null
    for (let attempt = 0; attempt < 2 && !connection; attempt++) {
      try {
        connection = await connectOnce(tenantId, { timeoutMs: CONNECT_TIMEOUT_MS })
      } catch (error) {
        if (error instanceof WhatsAppError && error.code === 'not_connected') {
          await markLoggedOut(tenantId, 'o WhatsApp pediu um novo QR code ao enviar (sessão salva não vale mais)')
          throw error
        }
        if (error instanceof WhatsAppError && error.code === 'logged_out') {
          await markLoggedOut(tenantId, 'sessão encerrada (aparelho removido no celular ou bloqueio do WhatsApp)')
          throw new WhatsAppError(
            'not_connected',
            'O WhatsApp foi desconectado pelo celular. Conecte de novo no painel.'
          )
        }
        if (attempt === 1) throw error
        await sleep(5000)
      }
    }
    const { sock } = connection!
    let sent = 0
    const send: SendWhatsApp = async (phone, text) => {
      if (sent > 0) await sleep(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS))
      const [result] = (await sock.onWhatsApp(phone)) ?? []
      if (!result?.exists) {
        throw new WhatsAppError('not_on_whatsapp', 'Esse número não tem WhatsApp.')
      }
      const message = await sock.sendMessage(result.jid, { text })
      sent += 1
      if (message?.key.id) await waitForAck(sock, message.key.id)
    }
    try {
      return await run(send)
    } finally {
      await closeSocket(connection!)
    }
  } finally {
    await releaseLock(tenantId)
  }
}
