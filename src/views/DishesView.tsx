import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, BookMarked, UtensilsCrossed, Pencil } from 'lucide-react'
import type { Dish } from '../types'
import { useStore } from '../store'
import { DishEditor } from '../components/DishEditor'

function newDish(): Dish {
  return { id: crypto.randomUUID(), title: '', servings: 2, ingredients: [] }
}

export function DishesView() {
  const { state } = useStore()
  const [editing, setEditing] = useState<Dish | null>(null)
  const [q, setQ] = useState('')

  const dishes = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return state.dishes
      .filter((d) => !needle || d.title.toLowerCase().includes(needle))
      .sort((a, b) => a.title.localeCompare(b.title, 'fr'))
  }, [state.dishes, q])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-plum">
            <BookMarked size={16} />
            <span className="label text-plum/80">Bibliothèque</span>
          </div>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Mes plats</h2>
          <p className="mt-1 text-sm text-muted">
            {state.dishes.length} plat{state.dishes.length > 1 ? 's' : ''} réutilisable
            {state.dishes.length > 1 ? 's' : ''} dans le calendrier
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
          <button className="btn-primary" onClick={() => setEditing(newDish())}>
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </div>

      {dishes.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 text-5xl">📖</div>
          <h3 className="font-display text-2xl font-semibold">{q ? 'Aucun résultat' : 'Aucun plat enregistré'}</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {q
              ? 'Essayez un autre terme de recherche.'
              : 'Créez vos plats favoris une fois, puis assignez-les en un instant à n’importe quel jour du calendrier.'}
          </p>
          {!q && (
            <button className="btn-primary mt-5" onClick={() => setEditing(newDish())}>
              <Plus size={16} /> Créer un plat
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {dishes.map((d) => (
              <motion.button
                key={d.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setEditing(d)}
                className="panel group flex flex-col items-start p-4 text-left transition-all hover:border-tomato/40 hover:shadow-lift"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-medium leading-tight">{d.title}</h3>
                  <Pencil size={14} className="reveal mt-1 shrink-0 text-muted transition-all" />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <UtensilsCrossed size={12} />
                  {d.ingredients.length} ingrédient{d.ingredients.length > 1 ? 's' : ''} · {d.servings} portion
                  {d.servings > 1 ? 's' : ''}
                </p>
                {d.ingredients.length > 0 && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted/80">
                    {d.ingredients.map((i) => i.name).join(', ')}
                  </p>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <DishEditor open={!!editing} dish={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
