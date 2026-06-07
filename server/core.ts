import { createClient, type Client, type Row } from '@libsql/client'

let _db: Client | null = null
let schemaReady = false

/** Local dev uses a file (`local.db`); production uses Turso via env vars. */
export function getDb(): Client {
  if (_db) return _db
  const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
  const authToken = process.env.TURSO_AUTH_TOKEN
  _db = createClient(authToken ? { url, authToken } : { url })
  return _db
}

export async function ensureSchema(db: Client): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS users (
       email TEXT PRIMARY KEY,
       password_hash TEXT NOT NULL,
       created_at INTEGER
     )`,
  )
  await db.execute(
    `CREATE TABLE IF NOT EXISTS app_data (
       id TEXT PRIMARY KEY,
       data TEXT NOT NULL,
       updated_at INTEGER
     )`,
  )
}

/** Returns a ready-to-use client, creating the schema once per warm instance. */
export async function db(): Promise<Client> {
  const d = getDb()
  if (!schemaReady) {
    await ensureSchema(d)
    schemaReady = true
  }
  return d
}

export async function findUser(d: Client, email: string): Promise<Row | null> {
  const r = await d.execute({ sql: 'SELECT email, password_hash FROM users WHERE email = ?', args: [email] })
  return r.rows.length ? r.rows[0] : null
}

export async function upsertUser(d: Client, email: string, passwordHash: string): Promise<void> {
  await d.execute({
    sql: `INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`,
    args: [email, passwordHash, Date.now()],
  })
}

/** The whole shared app state, stored as a single JSON document. */
export async function getState(d: Client): Promise<unknown | null> {
  const r = await d.execute({ sql: 'SELECT data FROM app_data WHERE id = ?', args: ['shared'] })
  if (!r.rows.length) return null
  try {
    return JSON.parse(String(r.rows[0].data))
  } catch {
    return null
  }
}

export async function putState(d: Client, state: unknown): Promise<void> {
  await d.execute({
    sql: `INSERT INTO app_data (id, data, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: ['shared', JSON.stringify(state), Date.now()],
  })
}
