export type Unit =
  | 'pièce'
  | 'g'
  | 'kg'
  | 'mL'
  | 'L'
  | 'c.à.c'
  | 'c.à.s'
  | 'pincée'
  | 'tranche'
  | 'botte'

export const UNITS: Unit[] = [
  'pièce',
  'g',
  'kg',
  'mL',
  'L',
  'c.à.c',
  'c.à.s',
  'pincée',
  'tranche',
  'botte',
]

export type Slot = 'petit-dej' | 'dejeuner' | 'diner'

export const SLOTS: { id: Slot; label: string; short: string }[] = [
  { id: 'petit-dej', label: 'Petit-déjeuner', short: 'Matin' },
  { id: 'dejeuner', label: 'Déjeuner', short: 'Midi' },
  { id: 'diner', label: 'Dîner', short: 'Soir' },
]

export interface Ingredient {
  id: string
  name: string
  qty: number
  unit: Unit
}

export interface Meal {
  id: string
  date: string // yyyy-MM-dd
  slot: Slot
  title: string
  servings: number
  ingredients: Ingredient[]
  notes?: string
  cooked?: boolean
}

export type FridgeCategory =
  | 'Légumes'
  | 'Fruits'
  | 'Viandes & Poissons'
  | 'Produits laitiers'
  | 'Épicerie'
  | 'Surgelés'
  | 'Boissons'
  | 'Autre'

export const CATEGORIES: FridgeCategory[] = [
  'Légumes',
  'Fruits',
  'Viandes & Poissons',
  'Produits laitiers',
  'Épicerie',
  'Surgelés',
  'Boissons',
  'Autre',
]

export interface FridgeItem {
  id: string
  name: string
  qty: number
  unit: Unit
  category: FridgeCategory
  expiry?: string // yyyy-MM-dd
}

export interface ShoppingItem {
  id: string
  name: string
  qty: number
  unit: Unit
  checked: boolean
  manual: boolean
}

export interface AppState {
  meals: Meal[]
  fridge: FridgeItem[]
  manualShopping: ShoppingItem[] // items added by hand
  checkedAuto: string[] // keys (name|unit) of auto-generated items ticked off
}
