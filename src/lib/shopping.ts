import type { FridgeItem, Ingredient, Meal, ShoppingItem, Unit } from '../types'

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
}

export function keyOf(name: string, unit: Unit): string {
  return `${normalizeName(name)}|${unit}`
}

export function formatQty(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString().replace('.', ',')
}

export interface DerivedShoppingItem extends ShoppingItem {
  key: string
  needed: number // total required by meals
  inStock: number // available in fridge
  source: 'auto' | 'manual'
}

/** Sum every ingredient across the given meals, keyed by name + unit. */
function aggregateNeeds(meals: Meal[]): Map<string, { name: string; unit: Unit; qty: number }> {
  const map = new Map<string, { name: string; unit: Unit; qty: number }>()
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      if (!ing.name.trim()) continue
      const key = keyOf(ing.name, ing.unit)
      const existing = map.get(key)
      if (existing) existing.qty += ing.qty
      else map.set(key, { name: ing.name.trim(), unit: ing.unit, qty: ing.qty })
    }
  }
  return map
}

/** Fridge stock keyed the same way as needs. */
function fridgeStock(fridge: FridgeItem[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of fridge) {
    const key = keyOf(item.name, item.unit)
    map.set(key, (map.get(key) ?? 0) + item.qty)
  }
  return map
}

/**
 * The smart core: what must we buy?
 * needs(from planned meals) − stock(fridge) + manual additions.
 */
export function computeShoppingList(
  meals: Meal[],
  fridge: FridgeItem[],
  manual: ShoppingItem[],
  checkedAuto: string[],
): DerivedShoppingItem[] {
  const needs = aggregateNeeds(meals)
  const stock = fridgeStock(fridge)
  const checked = new Set(checkedAuto)
  const manualKeys = new Set(manual.map((m) => keyOf(m.name, m.unit)))

  const auto: DerivedShoppingItem[] = []
  for (const [key, need] of needs) {
    const inStock = stock.get(key) ?? 0
    const missing = need.qty - inStock
    if (missing <= 0.0001) continue // fully covered by the fridge
    if (manualKeys.has(key)) continue // a manual line already covers this item
    auto.push({
      id: key,
      key,
      name: need.name,
      unit: need.unit,
      qty: Math.round(missing * 100) / 100,
      needed: need.qty,
      inStock,
      checked: checked.has(key),
      manual: false,
      source: 'auto',
    })
  }

  const manualItems: DerivedShoppingItem[] = manual.map((m) => ({
    ...m,
    key: keyOf(m.name, m.unit),
    needed: m.qty,
    inStock: 0,
    source: 'manual',
  }))

  return [...auto, ...manualItems].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1
    return a.name.localeCompare(b.name, 'fr')
  })
}

/** Build fridge items from the checked shopping lines, merging into existing stock. */
export function mergeIntoFridge(
  fridge: FridgeItem[],
  bought: DerivedShoppingItem[],
): { fridge: FridgeItem[]; added: number } {
  const next = fridge.map((f) => ({ ...f }))
  let added = 0
  for (const item of bought) {
    const idx = next.findIndex((f) => keyOf(f.name, f.unit) === item.key)
    if (idx >= 0) {
      next[idx].qty += item.qty
    } else {
      next.push({
        id: crypto.randomUUID(),
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        category: 'Autre',
      })
    }
    added++
  }
  return { fridge: next, added }
}

export function emptyIngredient(): Ingredient {
  return { id: crypto.randomUUID(), name: '', qty: 1, unit: 'pièce' }
}
