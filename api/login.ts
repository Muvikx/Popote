import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleLogin } from '../server/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' })
  const r = await handleLogin(req.body)
  if (r.setCookie) res.setHeader('Set-Cookie', r.setCookie)
  res.status(r.status).json(r.json)
}
