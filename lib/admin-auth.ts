import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'rb-admin'

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.')
  }
  return secret
}

function signature(expiresAt: string) {
  return createHmac('sha256', getSecret()).update(expiresAt).digest('hex')
}

export function createAdminCookieValue() {
  const expiresAt = String(Date.now() + 8 * 60 * 60 * 1000)
  return `${expiresAt}.${signature(expiresAt)}`
}

export function verifyAdminCookieValue(value: string | undefined) {
  if (!value) return false
  const [expiresAt, suppliedSignature] = value.split('.')
  if (!expiresAt || !suppliedSignature || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) {
    return false
  }

  try {
    const expectedSignature = signature(expiresAt)
    const supplied = Buffer.from(suppliedSignature, 'hex')
    const expected = Buffer.from(expectedSignature, 'hex')
    return supplied.length === expected.length && timingSafeEqual(supplied, expected)
  } catch {
    return false
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  return verifyAdminCookieValue(cookieStore.get(COOKIE_NAME)?.value)
}

export const adminCookieName = COOKIE_NAME
