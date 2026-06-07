import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleLogout } from '../server/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' })
  const r = await handleLogout()
  if (r.setCookie) res.setHeader('Set-Cookie', r.setCookie)
  res.status(r.status).json(r.json)
}
