import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) return false

  const derivedHash = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(storedHash, 'hex')

  if (storedBuffer.length !== derivedHash.length) return false
  return timingSafeEqual(storedBuffer, derivedHash)
}
