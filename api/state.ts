import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleGetState, handlePutState } from '../server/handlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookie = req.headers.cookie
  let r
  if (req.method === 'GET') r = await handleGetState(cookie)
  else if (req.method === 'PUT') r = await handlePutState(cookie, req.body)
  else return res.status(405).json({ error: 'Méthode non autorisée.' })
  res.status(r.status).json(r.json)
}
