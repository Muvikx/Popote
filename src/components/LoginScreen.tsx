import { useState } from 'react'
import { motion } from 'framer-motion'
import { Carrot, LogIn, Loader2 } from 'lucide-react'

interface Props {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || !email || !password) return
    setBusy(true)
    setError(null)
    const r = await onLogin(email, password)
    if (!r.ok) {
      setError(r.error || 'Connexion impossible.')
      setBusy(false)
    }
    // on success, the store flips to "ready" and this screen unmounts
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tomato text-paper shadow-lift">
            <Carrot size={30} strokeWidth={2} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Popote</h1>
          <p className="mt-1 text-sm text-muted">Connectez-vous pour retrouver vos repas.</p>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-6">
          <div>
            <label className="label mb-1.5 block">E-mail</label>
            <input
              type="email"
              autoComplete="username"
              autoFocus
              className="field"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Mot de passe</label>
            <input
              type="password"
              autoComplete="current-password"
              className="field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-tomato/30 bg-tomato/10 px-3 py-2 text-sm font-medium text-tomato"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy || !email || !password}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">Accès privé · réservé aux comptes autorisés</p>
      </motion.div>
    </div>
  )
}
