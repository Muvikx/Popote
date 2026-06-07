import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2, Plus, UtensilsCrossed, BookmarkPlus, Check, Search } from 'lucide-react'
import { Modal } from './Modal'
import { UNITS, type Dish, type Meal, type Slot } from '../types'
import { SLOTS } from '../types'
import { emptyIngredient } from '../lib/shopping'
import { prettyDate } from '../lib/date'
import { useStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
  meal: Meal | null
}

function cloneIngredients(ings: Dish['ingredients']) {
  return ings.map((i) => ({ ...i, id: crypto.randomUUID() }))
}

export function MealEditor({ open, onClose, meal }: Props) {
  const { state, saveMeal, deleteMeal, saveDish } = useStore()
  const [draft, setDraft] = useState<Meal | null>(meal)
  const [showSug, setShowSug] = useState(false)
  const [savedDish, setSavedDish] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(meal)
    setSavedDish(false)
    setShowSug(false)
  }, [meal])

  const suggestions = useMemo(() => {
    if (!draft) return []
    const q = draft.title.trim().toLowerCase()
    const list = q ? state.dishes.filter((d) => d.title.toLowerCase().includes(q)) : state.dishes
    return list.slice(0, 6)
  }, [state.dishes, draft])

  if (!draft) return null

  const isNew = !meal?.title
  const set = (patch: Partial<Meal>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const pickDish = (dish: Dish) => {
    set({
      title: dish.title,
      servings: dish.servings,
      ingredients: cloneIngredients(dish.ingredients),
      notes: dish.notes,
    })
    setShowSug(false)
  }

  const updateIng = (id: string, patch: Partial<Meal['ingredients'][number]>) =>
    set({ ingredients: draft.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const removeIng = (id: string) =>
    set({ ingredients: draft.ingredients.filter((i) => i.id !== id) })
  const addIng = () => set({ ingredients: [...draft.ingredients, emptyIngredient()] })

  const canSave = draft.title.trim().length > 0

  const onSave = () => {
    if (!canSave) return
    saveMeal({
      ...draft,
      title: draft.title.trim(),
      ingredients: draft.ingredients.filter((i) => i.name.trim()),
    })
    onClose()
  }

  const onSaveAsDish = () => {
    if (!canSave) return
    saveDish({
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      servings: draft.servings,
      ingredients: cloneIngredients(draft.ingredients.filter((i) => i.name.trim())),
      notes: draft.notes,
    })
    setSavedDish(true)
    setTimeout(() => setSavedDish(false), 2200)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Nouveau repas' : draft.title || 'Repas'}
      subtitle={`${prettyDate(draft.date)} · ${SLOTS.find((s) => s.id === draft.slot)?.label}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          {!isNew ? (
            <button
              className="btn text-tomato hover:bg-tomato/10"
              onClick={() => {
                deleteMeal(draft.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" onClick={onSave} disabled={!canSave}>
              Enregistrer
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="label">Nom du plat</label>
            <button
              className="flex items-center gap-1 text-xs font-semibold text-herb transition-colors hover:text-[#138a58] disabled:opacity-40"
              onClick={onSaveAsDish}
              disabled={!canSave}
            >
              {savedDish ? <Check size={13} /> : <BookmarkPlus size={13} />}
              {savedDish ? 'Plat enregistré' : 'Enregistrer comme plat'}
            </button>
          </div>
          <div className="relative">
            {state.dishes.length > 0 && (
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
            )}
            <input
              autoFocus={isNew}
              className={`field text-base ${state.dishes.length > 0 ? 'pl-9' : ''}`}
              placeholder={
                state.dishes.length > 0 ? 'Rechercher ou nommer un plat…' : 'ex. Risotto aux champignons'
              }
              value={draft.title}
              onChange={(e) => {
                set({ title: e.target.value })
                setShowSug(true)
              }}
              onFocus={() => setShowSug(true)}
              onBlur={() => {
                blurTimer.current = setTimeout(() => setShowSug(false), 120)
              }}
            />
            {showSug && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-card p-1 shadow-lift">
                <li className="px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted">
                  Plats enregistrés
                </li>
                {suggestions.map((d) => (
                  <li key={d.id}>
                    <button
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-paper"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (blurTimer.current) clearTimeout(blurTimer.current)
                        pickDish(d)
                      }}
                    >
                      <span className="font-medium text-ink">{d.title}</span>
                      <span className="shrink-0 text-xs text-muted">{d.ingredients.length} ingr.</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Jour</label>
            <input
              type="date"
              className="field"
              value={draft.date}
              onChange={(e) => e.target.value && set({ date: e.target.value })}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Portions</label>
            <input
              type="number"
              min={1}
              className="field"
              value={draft.servings}
              onChange={(e) => set({ servings: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Créneau</label>
          <div className="flex gap-1.5 rounded-full border border-line bg-card p-1">
            {SLOTS.map((s) => (
              <button
                key={s.id}
                onClick={() => set({ slot: s.id as Slot })}
                className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-colors ${
                  draft.slot === s.id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label flex items-center gap-1.5">
              <UtensilsCrossed size={13} /> Ingrédients
            </label>
            <span className="text-xs text-muted">{draft.ingredients.length} ligne(s)</span>
          </div>
          <div className="space-y-2">
            {draft.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-2">
                <input
                  className="field min-w-0 flex-1 py-2"
                  placeholder="Ingrédient"
                  value={ing.name}
                  onChange={(e) => updateIng(ing.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="field w-14 px-1.5 py-2 text-center tabular-nums"
                  value={ing.qty}
                  onChange={(e) => updateIng(ing.id, { qty: Number(e.target.value) || 0 })}
                />
                <select
                  className="field w-[4.5rem] px-1.5 py-2"
                  value={ing.unit}
                  onChange={(e) =>
                    updateIng(ing.id, { unit: e.target.value as Meal['ingredients'][number]['unit'] })
                  }
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  className="icon-btn shrink-0 hover:border-tomato/40 hover:text-tomato"
                  onClick={() => removeIng(ing.id)}
                  aria-label="Retirer l'ingrédient"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-ghost mt-2.5 w-full border-dashed" onClick={addIng}>
            <Plus size={16} /> Ajouter un ingrédient
          </button>
        </div>

        <div>
          <label className="label mb-1.5 block">Notes (facultatif)</label>
          <textarea
            className="field min-h-[72px] resize-y"
            placeholder="Préparation, astuces…"
            value={draft.notes ?? ''}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
