import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, Refrigerator, AlertTriangle } from 'lucide-react'
import { CATEGORIES, type FridgeItem } from '../types'
import { useStore } from '../store'
import { QtyStepper } from '../components/QtyStepper'
import { FridgeEditor } from '../components/FridgeEditor'
import { daysUntil } from '../lib/date'

function newItem(): FridgeItem {
  return { id: crypto.randomUUID(), name: '', qty: 1, unit: 'pièce', category: 'Autre' }
}

const CATEGORY_ICON: Record<string, string> = {
  Légumes: '🥬',
  Fruits: '🍎',
  'Viandes & Poissons': '🐟',
  'Produits laitiers': '🧀',
  Épicerie: '🫙',
  Surgelés: '🧊',
  Boissons: '🧃',
  Autre: '🍽️',
}

function expiryInfo(iso?: string) {
  if (!iso) return null
  const d = daysUntil(iso)
  if (d < 0) return { label: 'Périmé', cls: 'border-tomato/40 bg-tomato/10 text-tomato', urgent: true }
  if (d === 0) return { label: "Aujourd'hui", cls: 'border-tomato/40 bg-tomato/10 text-tomato', urgent: true }
  if (d <= 2) return { label: `J-${d}`, cls: 'border-saffron/50 bg-saffron/15 text-[#9a6c12]', urgent: true }
  if (d <= 5) return { label: `J-${d}`, cls: 'border-saffron/30 bg-saffron/10 text-[#9a6c12]', urgent: false }
  return { label: `J-${d}`, cls: 'border-line bg-paper text-muted', urgent: false }
}

export function FridgeView() {
  const { state, adjustFridgeQty, deleteFridgeItem } = useStore()
  const [editing, setEditing] = useState<FridgeItem | null>(null)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return state.fridge.filter((f) => !needle || f.name.toLowerCase().includes(needle))
  }, [state.fridge, q])

  const grouped = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      cat,
      items: filtered
        .filter((f) => f.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  const expiringSoon = useMemo(
    () =>
      state.fridge
        .filter((f) => f.expiry && daysUntil(f.expiry) <= 2)
        .sort((a, b) => daysUntil(a.expiry!) - daysUntil(b.expiry!)),
    [state.fridge],
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-herb">
            <Refrigerator size={16} />
            <span className="label text-herb/80">Inventaire</span>
          </div>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Le Frigo</h2>
          <p className="mt-1 text-sm text-muted">
            {state.fridge.length} aliment{state.fridge.length > 1 ? 's' : ''} en stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field w-40 py-2 pl-9 sm:w-52"
              placeholder="Rechercher…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn-herb" onClick={() => setEditing(newItem())}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl2 border border-saffron/40 bg-saffron/10 px-4 py-3"
        >
          <span className="flex items-center gap-1.5 font-semibold text-[#9a6c12]">
            <AlertTriangle size={16} /> À consommer vite
          </span>
          {expiringSoon.map((f) => (
            <span key={f.id} className="text-sm text-ink/80">
              {f.name}
              <span className="text-muted"> ({daysUntil(f.expiry!) < 0 ? 'périmé' : daysUntil(f.expiry!) === 0 ? "aujourd'hui" : `J-${daysUntil(f.expiry!)}`})</span>
            </span>
          ))}
        </motion.div>
      )}

      {grouped.length === 0 ? (
        <EmptyFridge onAdd={() => setEditing(newItem())} hasQuery={!!q} />
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.cat}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-muted">
                <span className="text-base">{CATEGORY_ICON[group.cat]}</span>
                {group.cat}
                <span className="text-muted/60">· {group.items.length}</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {group.items.map((item) => {
                    const exp = expiryInfo(item.expiry)
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`panel group flex items-center justify-between gap-3 p-3.5 ${
                          exp?.urgent ? 'ring-1 ring-saffron/30' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-display text-lg font-medium leading-tight">{item.name}</h4>
                            {exp && (
                              <span className={`chip shrink-0 px-2 py-0.5 text-[0.65rem] ${exp.cls}`}>{exp.label}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {item.qty} {item.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <QtyStepper
                            value={item.qty}
                            onChange={(v) => adjustFridgeQty(item.id, v - item.qty)}
                            compact
                          />
                          <button
                            className="reveal flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:text-ink"
                            onClick={() => setEditing(item)}
                            aria-label="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="reveal flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all hover:text-tomato"
                            onClick={() => deleteFridgeItem(item.id)}
                            aria-label="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      <FridgeEditor open={!!editing} item={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EmptyFridge({ onAdd, hasQuery }: { onAdd: () => void; hasQuery: boolean }) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 text-5xl">🧺</div>
      <h3 className="font-display text-2xl font-semibold">
        {hasQuery ? 'Aucun résultat' : 'Le frigo est vide'}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        {hasQuery
          ? 'Essayez un autre terme de recherche.'
          : 'Ajoutez vos aliments pour suivre votre stock et générer vos courses automatiquement.'}
      </p>
      {!hasQuery && (
        <button className="btn-herb mt-5" onClick={onAdd}>
          <Plus size={16} /> Ajouter un aliment
        </button>
      )}
    </div>
  )
}
