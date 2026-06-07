import { verifySession } from './auth'

export function parseCookies(header?: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k) out[k] = decodeURIComponent(v)
  }
  return out
}

export async function getEmailFromCookie(header?: string | null): Promise<string | null> {
  const token = parseCookies(header)['session']
  return token ? verifySession(token) : null
}

const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function base(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax${secure}`
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; ${base()}; Max-Age=${MAX_AGE}`
}

export function clearCookie(): string {
  return `${COOKIE}=; ${base()}; Max-Age=0`
}
