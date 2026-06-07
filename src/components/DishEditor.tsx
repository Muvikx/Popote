import { useEffect, useState } from 'react'
import { Trash2, Plus, UtensilsCrossed } from 'lucide-react'
import { Modal } from './Modal'
import { UNITS, type Dish } from '../types'
import { emptyIngredient } from '../lib/shopping'
import { useStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
  dish: Dish | null
}

export function DishEditor({ open, onClose, dish }: Props) {
  const { saveDish, deleteDish } = useStore()
  const [draft, setDraft] = useState<Dish | null>(dish)

  useEffect(() => setDraft(dish), [dish])
  if (!draft) return null

  const isNew = !dish?.title
  const set = (patch: Partial<Dish>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const updateIng = (id: string, patch: Partial<Dish['ingredients'][number]>) =>
    set({ ingredients: draft.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  const removeIng = (id: string) =>
    set({ ingredients: draft.ingredients.filter((i) => i.id !== id) })
  const addIng = () => set({ ingredients: [...draft.ingredients, emptyIngredient()] })

  const canSave = draft.title.trim().length > 0

  const onSave = () => {
    if (!canSave) return
    saveDish({
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
      title={isNew ? 'Nouveau plat' : draft.title || 'Plat'}
      subtitle="Plat réutilisable dans votre calendrier"
      footer={
        <div className="flex items-center justify-between gap-3">
          {!isNew ? (
            <button
              className="btn text-tomato hover:bg-tomato/10"
              onClick={() => {
                deleteDish(draft.id)
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
        <div className="grid grid-cols-[1fr_auto] gap-3">
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
          <div className="w-24">
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
                    updateIng(ing.id, { unit: e.target.value as Dish['ingredients'][number]['unit'] })
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
