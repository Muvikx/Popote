import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, ShoppingBasket, Trash2, Sparkles, ArrowDownToLine } from 'lucide-react'
import { UNITS, type Unit } from '../types'
import { useStore } from '../store'
import { computeShoppingList, formatQty, type DerivedShoppingItem } from '../lib/shopping'
import { addDays, toISO, weekDays, weekStart } from '../lib/date'

type Range = '7days' | 'week' | 'all'

const RANGES: { id: Range; label: string }[] = [
  { id: '7days', label: '7 prochains jours' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'all', label: 'Tous les repas à venir' },
]

export function ShoppingView() {
  const { state, toggleShopChecked, addManualShop, deleteManualShop, stockChecked } = useStore()
  const [range, setRange] = useState<Range>('7days')
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState<Unit>('pièce')

  const plannedMeals = useMemo(() => {
    const todayISO = toISO(new Date())
    let lo = todayISO
    let hi = '9999-12-31'
    if (range === '7days') hi = toISO(addDays(new Date(), 6))
    if (range === 'week') {
      const days = weekDays(weekStart(new Date()))
      lo = toISO(days[0])
      hi = toISO(days[6])
    }
    return state.meals.filter((m) => !m.cooked && m.date >= lo && m.date <= hi)
  }, [state.meals, range])

  const items = useMemo(
    () => computeShoppingList(plannedMeals, state.fridge, state.manualShopping, state.checkedAuto),
    [plannedMeals, state.fridge, state.manualShopping, state.checkedAuto],
  )

  const checked = items.filter((i) => i.checked)
  const remaining = items.length - checked.length
  const autoCount = items.filter((i) => i.source === 'auto').length

  const onAdd = () => {
    if (!name.trim()) return
    addManualShop(name, qty, unit)
    setName('')
    setQty(1)
    setUnit('pièce')
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-tomato">
            <ShoppingBasket size={16} />
            <span className="label text-tomato/80">Liste générée</span>
          </div>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Les Courses</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <Sparkles size={13} className="text-saffron" />
            {autoCount > 0
              ? `${autoCount} article(s) déduits de vos repas et de votre frigo`
              : 'Aucun manque détecté pour vos repas planifiés'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-line bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(280px,340px)]">
        {/* Receipt list */}
        <div className="panel overflow-hidden">
          {items.length === 0 ? (
            <EmptyShopping />
          ) : (
            <ul className="divide-y divide-dashed divide-line">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleShopChecked(item)}
                    onDelete={item.source === 'manual' ? () => deleteManualShop(item.id) : undefined}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Side panel: add manual + actions */}
        <aside className="space-y-4">
          <div className="panel p-4">
            <h3 className="mb-3 flex items-center gap-1.5 font-display text-lg font-semibold">
              <Plus size={16} className="text-tomato" /> Ajouter à la main
            </h3>
            <div className="space-y-2.5">
              <input
                className="field"
                placeholder="Article (ex. Lessive)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="field w-20 text-center tabular-nums"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 0)}
                />
                <select className="field flex-1" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary w-full" onClick={onAdd} disabled={!name.trim()}>
                <Plus size={16} /> Ajouter
              </button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">À acheter</span>
              <span className="font-display text-2xl font-semibold tabular-nums">{remaining}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted">Dans le panier</span>
              <span className="font-display text-2xl font-semibold tabular-nums text-herb">{checked.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
              <motion.div
                className="h-full rounded-full bg-herb"
                initial={false}
                animate={{ width: `${items.length ? (checked.length / items.length) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              />
            </div>
            <button
              className="btn-herb mt-4 w-full"
              disabled={checked.length === 0}
              onClick={() => stockChecked(checked)}
            >
              <ArrowDownToLine size={16} /> Ranger dans le frigo ({checked.length})
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Les articles cochés rejoignent votre stock et disparaissent de la liste.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: DerivedShoppingItem
  onToggle: () => void
  onDelete?: () => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="group flex items-center gap-3 px-4 py-3"
    >
      <button
        onClick={onToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
          item.checked
            ? 'border-herb bg-herb text-paper'
            : 'border-line text-transparent hover:border-herb'
        }`}
        aria-label={item.checked ? 'Décocher' : 'Cocher'}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.checked ? 'text-muted line-through' : 'text-ink'}`}>
            {item.name}
          </span>
          {item.source === 'manual' && (
            <span className="chip border-plum/30 bg-plum/10 px-1.5 py-0 text-[0.6rem] text-plum">manuel</span>
          )}
        </div>
        {item.source === 'auto' && item.inStock > 0 && !item.checked && (
          <p className="text-xs text-muted">
            besoin de {formatQty(item.needed)} · {formatQty(item.inStock)} au frigo
          </p>
        )}
      </div>

      <span
        className={`shrink-0 font-display text-base font-semibold tabular-nums ${
          item.checked ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {formatQty(item.qty)}
        <span className="ml-1 text-xs font-medium text-muted">{item.unit}</span>
      </span>

      {onDelete && (
        <button
          onClick={onDelete}
          className="reveal flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-all hover:text-tomato"
          aria-label="Retirer"
        >
          <Trash2 size={15} />
        </button>
      )}
    </motion.li>
  )
}

function EmptyShopping() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 text-5xl">✅</div>
      <h3 className="font-display text-2xl font-semibold">Rien à acheter</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Votre frigo couvre tous les repas planifiés sur cette période. Ajoutez des repas au calendrier ou un
        article à la main.
      </p>
    </div>
  )
}
