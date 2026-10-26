import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

// Cria um administrador da plataforma, ou gera senha nova se o e-mail já existir.
// Uso: npm run platform:admin -- voce@email.com "Seu Nome"
async function main() {
  const [rawEmail, ...nameParts] = process.argv.slice(2)
  const email = rawEmail?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Uso: npm run platform:admin -- voce@email.com "Seu Nome"')
    process.exit(1)
  }

  const { eq } = await import('drizzle-orm')
  const { getDb, schema } = await import('@/lib/db')
  const { hashPassword } = await import('@/lib/password')
  const { temporaryPassword } = await import('@/lib/provisioning')

  const db = getDb()
  const password = temporaryPassword(16)
  const [existing] = await db.select().from(schema.platformAdmins).where(eq(schema.platformAdmins.email, email))

  if (existing) {
    await db
      .update(schema.platformAdmins)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(schema.platformAdmins.id, existing.id))
    await db.delete(schema.platformSessions).where(eq(schema.platformSessions.adminId, existing.id))
    console.log(`Senha nova gerada para ${email} (sessões abertas encerradas).`)
  } else {
    await db.insert(schema.platformAdmins).values({
      email,
      name: nameParts.join(' ').trim() || email,
      passwordHash: hashPassword(password)
    })
    console.log(`Administrador criado: ${email}`)
  }

  console.log(`Senha: ${password}`)
  console.log('Guarde agora: ela não é mostrada de novo.')
  process.exit(0)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
