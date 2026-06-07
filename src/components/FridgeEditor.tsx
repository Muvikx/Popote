import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { CATEGORIES, UNITS, type FridgeItem } from '../types'
import { useStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
  item: FridgeItem | null
}

export function FridgeEditor({ open, onClose, item }: Props) {
  const { saveFridgeItem, deleteFridgeItem } = useStore()
  const [draft, setDraft] = useState<FridgeItem | null>(item)

  useEffect(() => setDraft(item), [item])
  if (!draft) return null

  const isNew = !item?.name
  const set = (patch: Partial<FridgeItem>) => setDraft((d) => (d ? { ...d, ...patch } : d))
  const canSave = draft.name.trim().length > 0

  const onSave = () => {
    if (!canSave) return
    saveFridgeItem({ ...draft, name: draft.name.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Ajouter au frigo' : draft.name || 'Article'}
      subtitle="Inventaire de votre garde-manger"
      footer={
        <div className="flex items-center justify-between gap-3">
          {!isNew ? (
            <button
              className="btn text-tomato hover:bg-tomato/10"
              onClick={() => {
                deleteFridgeItem(draft.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Retirer
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
          <label className="label mb-1.5 block">Aliment</label>
          <input
            autoFocus={isNew}
            className="field text-base"
            placeholder="ex. Carottes"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label mb-1.5 block">Quantité</label>
            <input
              type="number"
              min={0}
              step="any"
              className="field tabular-nums"
              value={draft.qty}
              onChange={(e) => set({ qty: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Unité</label>
            <select
              className="field"
              value={draft.unit}
              onChange={(e) => set({ unit: e.target.value as FridgeItem['unit'] })}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Catégorie</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => set({ category: c })}
                className={`chip transition-colors ${
                  draft.category === c
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-card text-muted hover:border-ink/30 hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Date de péremption (facultatif)</label>
          <input
            type="date"
            className="field"
            value={draft.expiry ?? ''}
            onChange={(e) => set({ expiry: e.target.value || undefined })}
          />
        </div>
      </div>
    </Modal>
  )
}
