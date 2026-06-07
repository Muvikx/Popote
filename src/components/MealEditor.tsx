import { useEffect, useState } from 'react'
import { Trash2, Plus, UtensilsCrossed } from 'lucide-react'
import { Modal } from './Modal'
import { UNITS, type Meal, type Slot } from '../types'
import { SLOTS } from '../types'
import { emptyIngredient } from '../lib/shopping'
import { prettyDate } from '../lib/date'
import { useStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
  meal: Meal | null
}

export function MealEditor({ open, onClose, meal }: Props) {
  const { saveMeal, deleteMeal } = useStore()
  const [draft, setDraft] = useState<Meal | null>(meal)

  useEffect(() => setDraft(meal), [meal])

  if (!draft) return null

  const isNew = !meal?.title
  const set = (patch: Partial<Meal>) => setDraft((d) => (d ? { ...d, ...patch } : d))

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
          <label className="label mb-1.5 block">Nom du plat</label>
          <input
            autoFocus={isNew}
            className="field text-base"
            placeholder="ex. Risotto aux champignons"
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Créneau</label>
            <div className="flex gap-1.5 rounded-full border border-line bg-card p-1">
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => set({ slot: s.id as Slot })}
                  className={`flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors ${
                    draft.slot === s.id ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  {s.short}
                </button>
              ))}
            </div>
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
                  className="field flex-1 py-2"
                  placeholder="Ingrédient"
                  value={ing.name}
                  onChange={(e) => updateIng(ing.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  className="field w-16 px-2 py-2 text-center tabular-nums"
                  value={ing.qty}
                  onChange={(e) => updateIng(ing.id, { qty: Number(e.target.value) || 0 })}
                />
                <select
                  className="field w-[5.5rem] px-2 py-2"
                  value={ing.unit}
                  onChange={(e) => updateIng(ing.id, { unit: e.target.value as Meal['ingredients'][number]['unit'] })}
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
