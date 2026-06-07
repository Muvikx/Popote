import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, Check, CalendarDays } from 'lucide-react'
import { SLOTS, type Meal, type Slot } from '../types'
import { useStore } from '../store'
import {
  dayName,
  dayNum,
  isToday,
  monthLabel,
  shiftWeek,
  toISO,
  weekDays,
  weekLabel,
  weekStart,
} from '../lib/date'
import { MealEditor } from '../components/MealEditor'

function blankMeal(date: string, slot: Slot): Meal {
  return { id: crypto.randomUUID(), date, slot, title: '', servings: 2, ingredients: [] }
}

export function CalendarView() {
  const { state, toggleCooked } = useStore()
  const [start, setStart] = useState(() => weekStart(new Date()))
  const [editing, setEditing] = useState<Meal | null>(null)

  const days = useMemo(() => weekDays(start), [start])

  const mealsAt = (iso: string, slot: Slot) =>
    state.meals.filter((m) => m.date === iso && m.slot === slot)

  const weekCount = useMemo(() => {
    const isos = new Set(days.map(toISO))
    return state.meals.filter((m) => isos.has(m.date)).length
  }, [days, state.meals])

  const openNew = (iso: string, slot: Slot) => setEditing(blankMeal(iso, slot))

  return (
    <div>
      {/* Week navigator */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-tomato">
            <CalendarDays size={16} />
            <span className="label text-tomato/80">{monthLabel(start)}</span>
          </div>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {weekLabel(start)}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {weekCount > 0 ? `${weekCount} repas planifié(s) cette semaine` : 'Aucun repas cette semaine'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn" onClick={() => setStart((s) => shiftWeek(s, -1))} aria-label="Semaine précédente">
            <ChevronLeft size={18} />
          </button>
          <button className="btn-ghost" onClick={() => setStart(weekStart(new Date()))}>
            Aujourd'hui
          </button>
          <button className="icon-btn" onClick={() => setStart((s) => shiftWeek(s, 1))} aria-label="Semaine suivante">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Desktop matrix: slots × days */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-2">
          <div />
          {days.map((d) => {
            const iso = toISO(d)
            const today = isToday(iso)
            return (
              <div
                key={iso}
                className={`rounded-xl px-2 py-2 text-center ${
                  today ? 'bg-tomato text-paper shadow-soft' : 'text-ink'
                }`}
              >
                <div className={`text-[0.7rem] font-bold uppercase tracking-wider ${today ? 'text-paper/80' : 'text-muted'}`}>
                  {dayName(d).slice(0, 3)}
                </div>
                <div className="font-display text-xl font-semibold leading-tight">{dayNum(d)}</div>
              </div>
            )
          })}

          {SLOTS.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              days={days}
              mealsAt={mealsAt}
              onAdd={openNew}
              onEdit={setEditing}
              onToggle={toggleCooked}
            />
          ))}
        </div>
      </div>

      {/* Mobile: stacked day cards */}
      <div className="space-y-3 md:hidden">
        {days.map((d) => {
          const iso = toISO(d)
          const today = isToday(iso)
          const dayMeals = SLOTS.map((s) => ({ slot: s, meals: mealsAt(iso, s.id) }))
          const total = dayMeals.reduce((n, x) => n + x.meals.length, 0)
          return (
            <div key={iso} className="panel overflow-hidden">
              <div
                className={`flex items-center justify-between px-4 py-2.5 ${
                  today ? 'bg-tomato text-paper' : 'bg-paper/60'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-semibold capitalize">{dayName(d)}</span>
                  <span className={today ? 'text-paper/80' : 'text-muted'}>{dayNum(d)}</span>
                </div>
                <span className={`text-xs ${today ? 'text-paper/80' : 'text-muted'}`}>{total} repas</span>
              </div>
              <div className="divide-y divide-line">
                {dayMeals.map(({ slot, meals }) => (
                  <div key={slot.id} className="flex items-stretch gap-3 px-4 py-2.5">
                    <div className="w-12 shrink-0 pt-1 text-[0.7rem] font-bold uppercase tracking-wide text-muted">
                      {slot.short}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {meals.map((m) => (
                        <MealCard key={m.id} meal={m} onEdit={setEditing} onToggle={toggleCooked} />
                      ))}
                      <button
                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-paper hover:text-tomato"
                        onClick={() => openNew(iso, slot.id)}
                      >
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <MealEditor open={!!editing} meal={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function SlotRow({
  slot,
  days,
  mealsAt,
  onAdd,
  onEdit,
  onToggle,
}: {
  slot: (typeof SLOTS)[number]
  days: Date[]
  mealsAt: (iso: string, slot: Slot) => Meal[]
  onAdd: (iso: string, slot: Slot) => void
  onEdit: (m: Meal) => void
  onToggle: (id: string) => void
}) {
  return (
    <>
      <div className="flex items-center pr-1">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">
          {slot.short}
        </span>
      </div>
      {days.map((d) => {
        const iso = toISO(d)
        const meals = mealsAt(iso, slot.id)
        return (
          <div
            key={iso}
            className={`group min-h-[92px] rounded-xl border p-1.5 transition-colors ${
              isToday(iso) ? 'border-tomato/30 bg-tomato/[0.04]' : 'border-line bg-card/60'
            }`}
          >
            <div className="space-y-1.5">
              {meals.map((m) => (
                <MealCard key={m.id} meal={m} onEdit={onEdit} onToggle={onToggle} compact />
              ))}
            </div>
            <button
              className={`mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-xs text-muted opacity-0 transition-all hover:text-tomato group-hover:opacity-100 ${
                meals.length === 0 ? 'opacity-60' : ''
              }`}
              onClick={() => onAdd(iso, slot.id)}
              aria-label="Ajouter un repas"
            >
              <Plus size={14} />
            </button>
          </div>
        )
      })}
    </>
  )
}

function MealCard({
  meal,
  onEdit,
  onToggle,
  compact,
}: {
  meal: Meal
  onEdit: (m: Meal) => void
  onToggle: (id: string) => void
  compact?: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onEdit(meal)}
      className={`cursor-pointer rounded-lg border bg-card px-2.5 py-2 shadow-sm transition-all hover:shadow-soft ${
        meal.cooked ? 'border-herb/30 bg-herb/[0.06]' : 'border-line hover:border-tomato/40'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <h4
          className={`font-display text-[0.92rem] font-medium leading-tight ${
            meal.cooked ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {meal.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(meal.id)
          }}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
            meal.cooked
              ? 'border-herb bg-herb text-paper'
              : 'border-line text-transparent hover:border-herb'
          }`}
          aria-label={meal.cooked ? 'Marquer non préparé' : 'Marquer préparé'}
        >
          <Check size={11} strokeWidth={3} />
        </button>
      </div>
      {!compact && meal.ingredients.length > 0 && (
        <p className="mt-1 text-xs text-muted">
          {meal.ingredients.length} ingrédient{meal.ingredients.length > 1 ? 's' : ''}
        </p>
      )}
      {compact && meal.ingredients.length > 0 && (
        <p className="mt-0.5 text-[0.68rem] text-muted">{meal.ingredients.length} ingr.</p>
      )}
    </motion.div>
  )
}
