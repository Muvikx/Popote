/**
 * Creates the schema and seeds the user accounts.
 * Reads credentials from env: USER1_EMAIL / USER1_PASSWORD … USER4_*.
 *
 *   npm run db:setup
 *
 * Local dev writes to ./local.db. Production targets Turso via
 * TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 */
import { ensureSchema, getDb, upsertUser } from '../server/core.js'
import { hashPassword } from '../server/auth.js'

try {
  process.loadEnvFile('.env')
} catch {
  /* rely on existing env */
}

async function main() {
  const db = getDb()
  await ensureSchema(db)

  const users: { email: string; password: string }[] = []
  for (let i = 1; i <= 4; i++) {
    const email = process.env[`USER${i}_EMAIL`]
    const password = process.env[`USER${i}_PASSWORD`]
    if (email && password) users.push({ email: email.trim().toLowerCase(), password })
  }

  if (users.length === 0) {
    console.error(
      '✗ Aucun compte défini. Renseignez USER1_EMAIL / USER1_PASSWORD (et USER2_*) dans votre .env ou les variables Vercel.',
    )
    process.exit(1)
  }

  for (const u of users) {
    await upsertUser(db, u.email, hashPassword(u.password))
    console.log(`✓ Compte prêt : ${u.email}`)
  }

  console.log(`\nSchéma initialisé. ${users.length} compte(s) configuré(s).`)
  process.exit(0)
}

main().catch((e) => {
  console.error('✗ Échec de l’initialisation :', e)
  process.exit(1)
})
