/**
 * Local dev API server — mirrors the Vercel functions in /api by calling the
 * exact same handlers. Vite proxies /api here during `npm run dev`.
 */
import http from 'node:http'
import { handleGetState, handleLogin, handleLogout, handlePutState, type HandlerResult } from './handlers'

try {
  // Node >= 20.12
  process.loadEnvFile('.env')
} catch {
  /* no .env file — rely on existing env */
}

const PORT = Number(process.env.API_PORT || 8787)

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  const send = (r: HandlerResult) => {
    if (r.setCookie) res.setHeader('Set-Cookie', r.setCookie)
    res.writeHead(r.status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(r.json))
  }
  try {
    if (url.pathname === '/api/login' && req.method === 'POST') return send(await handleLogin(await readBody(req)))
    if (url.pathname === '/api/logout' && req.method === 'POST') return send(await handleLogout())
    if (url.pathname === '/api/state' && req.method === 'GET') return send(await handleGetState(req.headers.cookie))
    if (url.pathname === '/api/state' && req.method === 'PUT')
      return send(await handlePutState(req.headers.cookie, await readBody(req)))
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Route introuvable.' }))
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(e) }))
  }
})

server.listen(PORT, () => console.log(`API dev → http://localhost:${PORT}`))
