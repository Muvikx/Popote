import type { AppState } from '../types'

export interface StateResponse {
  status: number
  data?: AppState | null
  user?: { email: string }
}

export async function apiGetState(): Promise<StateResponse> {
  const r = await fetch('/api/state', { credentials: 'same-origin' })
  if (r.status === 401) return { status: 401 }
  if (!r.ok) throw new Error(`GET /api/state → ${r.status}`)
  const j = await r.json()
  return { status: 200, data: (j.data ?? null) as AppState | null, user: j.user }
}

export async function apiPutState(state: AppState): Promise<void> {
  const r = await fetch('/api/state', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  if (!r.ok) throw new Error(`PUT /api/state → ${r.status}`)
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, error: j?.error }
}

export async function apiLogout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
}
