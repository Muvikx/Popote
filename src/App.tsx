import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  Refrigerator,
  ShoppingBasket,
  BookMarked,
  Carrot,
  RotateCcw,
  LogOut,
  Loader2,
  CloudOff,
  WifiOff,
} from 'lucide-react'
import { useStore } from './store'
import { CalendarView } from './views/CalendarView'
import { FridgeView } from './views/FridgeView'
import { ShoppingView } from './views/ShoppingView'
import { DishesView } from './views/DishesView'
import { LoginScreen } from './components/LoginScreen'
import { computeShoppingList } from './lib/shopping'
import { addDays, daysUntil, toISO } from './lib/date'

type Tab = 'calendar' | 'dishes' | 'fridge' | 'shopping'

export default function App() {
  const { state, status, user, offline, login, logout, reload, resetAll } = useStore()
  const [tab, setTab] = useState<Tab>('calendar')

  const toBuyCount = useMemo(() => {
    const lo = toISO(new Date())
    const hi = toISO(addDays(new Date(), 6))
    const meals = state.meals.filter((m) => !m.cooked && m.date >= lo && m.date <= hi)
    return computeShoppingList(meals, state.fridge, state.manualShopping, state.checkedAuto).filter(
      (i) => !i.checked,
    ).length
  }, [state])

  const expiringCount = useMemo(
    () => state.fridge.filter((f) => f.expiry && daysUntil(f.expiry) <= 2).length,
    [state.fridge],
  )

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
        <Carrot size={32} className="text-tomato" />
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    )
  }

  if (status === 'unauth') {
    return <LoginScreen onLogin={login} />
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <CloudOff size={36} className="text-tomato" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Connexion au serveur impossible</h1>
          <p className="mt-1 text-sm text-muted">Vérifiez votre connexion puis réessayez.</p>
        </div>
        <button className="btn-primary" onClick={() => void reload()}>
          <RotateCcw size={16} /> Réessayer
        </button>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: typeof CalendarDays; badge?: number }[] = [
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
    { id: 'dishes', label: 'Plats', icon: BookMarked },
    { id: 'fridge', label: 'Frigo', icon: Refrigerator, badge: expiringCount },
    { id: 'shopping', label: 'Courses', icon: ShoppingBasket, badge: toBuyCount },
  ]

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-24 pt-6 sm:px-6 sm:pb-16">
      {/* Brand header */}
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tomato text-paper shadow-soft">
            <Carrot size={26} strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-none tracking-tight sm:text-[1.7rem]">
              Popote
            </h1>
            <p className="mt-1 text-sm text-muted">Repas, frigo &amp; courses, sans rien oublier.</p>
          </div>
        </div>

        {/* Desktop segmented nav */}
        <nav className="hidden gap-1 self-auto rounded-full border border-line bg-card p-1 shadow-soft sm:flex">
          {tabs.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors lg:px-4 ${
                  active ? 'text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={16} />
                <span>{t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span
                    className={`ml-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.7rem] font-bold ${
                      active ? 'bg-paper text-ink' : 'bg-tomato text-paper'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </header>

      {offline && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-saffron/40 bg-saffron/10 px-4 py-2.5 text-sm font-medium text-[#9a6c12]">
          <WifiOff size={16} /> Hors ligne — vos modifications sont gardées sur cet appareil et seront
          synchronisées au retour du réseau.
        </div>
      )}

      {/* Views */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'calendar' && <CalendarView />}
            {tab === 'dishes' && <DishesView />}
            {tab === 'fridge' && <FridgeView />}
            {tab === 'shopping' && <ShoppingView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted sm:flex-row">
        <span className="flex items-center gap-2">
          {user && (
            <span>
              Connecté : <strong className="font-semibold text-ink/80">{user.email}</strong>
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-card hover:text-tomato"
            onClick={() => {
              if (confirm('Tout effacer (repas, plats, frigo, courses) ?')) resetAll()
            }}
          >
            <RotateCcw size={13} /> Tout effacer
          </button>
          <button
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-card hover:text-ink"
            onClick={() => void logout()}
          >
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card/95 backdrop-blur-md sm:hidden">
        {tabs.map((t) => {
          const active = tab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex flex-col items-center gap-0.5 py-2"
            >
              {active && <span className="absolute top-0 h-0.5 w-9 rounded-full bg-tomato" />}
              <span className="relative">
                <Icon size={21} className={active ? 'text-tomato' : 'text-muted'} />
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-tomato px-1 text-[0.6rem] font-bold text-paper">
                    {t.badge}
                  </span>
                )}
              </span>
              <span className={`text-[0.62rem] font-semibold ${active ? 'text-tomato' : 'text-muted'}`}>
                {t.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
