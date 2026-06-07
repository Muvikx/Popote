import { db, findUser, getState, putState } from './core'
import { signSession, verifyPassword } from './auth'
import { clearCookie, getEmailFromCookie, sessionCookie } from './http'

export interface HandlerResult {
  status: number
  json: unknown
  setCookie?: string
}

function isState(v: unknown): v is { meals: unknown[] } {
  return !!v && typeof v === 'object' && Array.isArray((v as { meals?: unknown }).meals)
}

export async function handleLogin(body: unknown): Promise<HandlerResult> {
  const b = (body ?? {}) as { email?: string; password?: string }
  const email = (b.email ?? '').trim().toLowerCase()
  const password = b.password ?? ''
  if (!email || !password) return { status: 400, json: { error: 'E-mail et mot de passe requis.' } }

  const user = await findUser(await db(), email)
  if (!user || !verifyPassword(password, String(user.password_hash))) {
    return { status: 401, json: { error: 'E-mail ou mot de passe incorrect.' } }
  }
  const token = await signSession(email)
  return { status: 200, json: { user: { email } }, setCookie: sessionCookie(token) }
}

export async function handleLogout(): Promise<HandlerResult> {
  return { status: 200, json: { ok: true }, setCookie: clearCookie() }
}

export async function handleGetState(cookieHeader?: string | null): Promise<HandlerResult> {
  const email = await getEmailFromCookie(cookieHeader)
  if (!email) return { status: 401, json: { error: 'Non authentifié.' } }
  const data = await getState(await db())
  return { status: 200, json: { user: { email }, data } }
}

export async function handlePutState(cookieHeader: string | null | undefined, body: unknown): Promise<HandlerResult> {
  const email = await getEmailFromCookie(cookieHeader)
  if (!email) return { status: 401, json: { error: 'Non authentifié.' } }
  if (!isState(body)) return { status: 400, json: { error: 'État invalide.' } }

  const b = body as Record<string, unknown>
  await putState(await db(), {
    meals: b.meals ?? [],
    fridge: b.fridge ?? [],
    manualShopping: b.manualShopping ?? [],
    checkedAuto: b.checkedAuto ?? [],
  })
  return { status: 200, json: { ok: true } }
}
