import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppState, FridgeItem, Meal, ShoppingItem, Unit } from './types'
import { mergeIntoFridge, type DerivedShoppingItem } from './lib/shopping'
import { addDays, toISO } from './lib/date'
import { apiGetState, apiLogin, apiLogout, apiPutState } from './lib/api'

const CACHE_KEY = 'garde-manger:cache'
const SAVE_DEBOUNCE = 800

function uid() {
  return crypto.randomUUID()
}

const EMPTY: AppState = { meals: [], fridge: [], manualShopping: [], checkedAuto: [] }

function seed(): AppState {
  const today = new Date()
  const day = (n: number) => toISO(addDays(today, n))
  const tdISO = day(0)

  const meals: Meal[] = [
    {
      id: uid(),
      date: day(-2),
      slot: 'diner',
      title: 'Quiche lorraine',
      servings: 4,
      cooked: true,
      ingredients: [
        { id: uid(), name: 'Pâte brisée', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Lardons', qty: 200, unit: 'g' },
        { id: uid(), name: 'Œufs', qty: 3, unit: 'pièce' },
        { id: uid(), name: 'Crème fraîche', qty: 200, unit: 'mL' },
      ],
    },
    {
      id: uid(),
      date: day(-1),
      slot: 'diner',
      title: 'Soupe de potiron',
      servings: 4,
      cooked: true,
      ingredients: [
        { id: uid(), name: 'Potiron', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Pomme de terre', qty: 2, unit: 'pièce' },
        { id: uid(), name: 'Crème fraîche', qty: 100, unit: 'mL' },
      ],
    },
    {
      id: uid(),
      date: tdISO,
      slot: 'dejeuner',
      title: 'Salade César au poulet',
      servings: 2,
      ingredients: [
        { id: uid(), name: 'Filet de poulet', qty: 300, unit: 'g' },
        { id: uid(), name: 'Salade romaine', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Parmesan', qty: 50, unit: 'g' },
        { id: uid(), name: 'Croûtons', qty: 1, unit: 'pièce' },
      ],
    },
    {
      id: uid(),
      date: tdISO,
      slot: 'diner',
      title: 'Risotto aux champignons',
      servings: 2,
      notes: 'Bien remuer, ajouter le bouillon louche par louche.',
      ingredients: [
        { id: uid(), name: 'Riz arborio', qty: 250, unit: 'g' },
        { id: uid(), name: 'Champignons de Paris', qty: 200, unit: 'g' },
        { id: uid(), name: 'Oignon', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Bouillon de légumes', qty: 1, unit: 'L' },
        { id: uid(), name: 'Parmesan', qty: 50, unit: 'g' },
      ],
    },
    {
      id: uid(),
      date: day(1),
      slot: 'dejeuner',
      title: 'Pâtes au pesto',
      servings: 2,
      ingredients: [
        { id: uid(), name: 'Pâtes', qty: 200, unit: 'g' },
        { id: uid(), name: 'Pesto', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Tomates cerises', qty: 150, unit: 'g' },
      ],
    },
    {
      id: uid(),
      date: day(1),
      slot: 'diner',
      title: 'Saumon & légumes rôtis',
      servings: 2,
      ingredients: [
        { id: uid(), name: 'Pavé de saumon', qty: 2, unit: 'tranche' },
        { id: uid(), name: 'Courgette', qty: 1, unit: 'pièce' },
        { id: uid(), name: 'Carotte', qty: 3, unit: 'pièce' },
        { id: uid(), name: "Huile d'olive", qty: 2, unit: 'c.à.s' },
      ],
    },
    {
      id: uid(),
      date: day(2),
      slot: 'diner',
      title: 'Curry de pois chiches',
      servings: 3,
      ingredients: [
        { id: uid(), name: 'Pois chiches', qty: 400, unit: 'g' },
        { id: uid(), name: 'Lait de coco', qty: 400, unit: 'mL' },
        { id: uid(), name: 'Pâte de curry', qty: 1, unit: 'c.à.s' },
        { id: uid(), name: 'Riz basmati', qty: 200, unit: 'g' },
      ],
    },
  ]

  const fridge: FridgeItem[] = [
    { id: uid(), name: 'Carotte', qty: 5, unit: 'pièce', category: 'Légumes', expiry: day(4) },
    { id: uid(), name: 'Oignon', qty: 3, unit: 'pièce', category: 'Légumes' },
    { id: uid(), name: 'Parmesan', qty: 80, unit: 'g', category: 'Produits laitiers', expiry: day(9) },
    { id: uid(), name: 'Riz arborio', qty: 500, unit: 'g', category: 'Épicerie' },
    { id: uid(), name: 'Lait', qty: 1, unit: 'L', category: 'Produits laitiers', expiry: day(1) },
    { id: uid(), name: 'Beurre', qty: 200, unit: 'g', category: 'Produits laitiers' },
    { id: uid(), name: 'Œufs', qty: 6, unit: 'pièce', category: 'Produits laitiers', expiry: day(12) },
    { id: uid(), name: 'Tomates cerises', qty: 200, unit: 'g', category: 'Légumes', expiry: day(2) },
  ]

  const manualShopping: ShoppingItem[] = [
    { id: uid(), name: 'Café moulu', qty: 1, unit: 'pièce', checked: false, manual: true },
  ]

  return { meals, fridge, manualShopping, checkedAuto: [] }
}

function normalize(s: Partial<AppState> | null | undefined): AppState {
  return {
    meals: s?.meals ?? [],
    fridge: s?.fridge ?? [],
    manualShopping: s?.manualShopping ?? [],
    checkedAuto: s?.checkedAuto ?? [],
  }
}

function readCache(): AppState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeCache(s: AppState) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    /* ignore quota errors */
  }
}

type Status = 'loading' | 'unauth' | 'ready' | 'error'

interface Store {
  state: AppState
  status: Status
  user: { email: string } | null
  offline: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  reload: () => Promise<void>
  saveMeal: (meal: Meal) => void
  deleteMeal: (id: string) => void
  toggleCooked: (id: string) => void
  saveFridgeItem: (item: FridgeItem) => void
  deleteFridgeItem: (id: string) => void
  adjustFridgeQty: (id: string, delta: number) => void
  toggleShopChecked: (item: DerivedShoppingItem) => void
  addManualShop: (name: string, qty: number, unit: Unit) => void
  deleteManualShop: (id: string) => void
  stockChecked: (checked: DerivedShoppingItem[]) => number
  resetAll: () => void
}

const StoreCtx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY)
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [offline, setOffline] = useState(false)

  const skipNextSave = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const booted = useRef(false)

  const boot = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await apiGetState()
      if (res.status === 401) {
        setUser(null)
        setStatus('unauth')
        return
      }
      setUser(res.user ?? null)
      setOffline(false)
      const incoming = res.data
      if (!incoming || (incoming.meals.length === 0 && incoming.fridge.length === 0)) {
        // First run on a fresh database: seed and let it persist.
        setState(seed())
      } else {
        skipNextSave.current = true // don't immediately re-PUT what we just fetched
        setState(normalize(incoming))
      }
      setStatus('ready')
    } catch {
      // Network/server error — fall back to the local cache if we have one.
      const cached = readCache()
      if (cached) {
        skipNextSave.current = true
        setState(cached)
        setOffline(true)
        setStatus('ready')
      } else {
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void boot()
  }, [boot])

  // Persist on change: immediate local cache + debounced API write.
  useEffect(() => {
    if (status !== 'ready') return
    writeCache(state)
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      apiPutState(state)
        .then(() => setOffline(false))
        .catch(() => setOffline(true))
    }, SAVE_DEBOUNCE)
  }, [state, status])

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await apiLogin(email, password)
      if (r.ok) await boot()
      return r
    },
    [boot],
  )

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setState(EMPTY)
    setStatus('unauth')
  }, [])

  const saveMeal = useCallback((meal: Meal) => {
    setState((s) => {
      const exists = s.meals.some((m) => m.id === meal.id)
      return {
        ...s,
        meals: exists ? s.meals.map((m) => (m.id === meal.id ? meal : m)) : [...s.meals, meal],
      }
    })
  }, [])

  const deleteMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }))
  }, [])

  const toggleCooked = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      meals: s.meals.map((m) => (m.id === id ? { ...m, cooked: !m.cooked } : m)),
    }))
  }, [])

  const saveFridgeItem = useCallback((item: FridgeItem) => {
    setState((s) => {
      const exists = s.fridge.some((f) => f.id === item.id)
      return {
        ...s,
        fridge: exists ? s.fridge.map((f) => (f.id === item.id ? item : f)) : [item, ...s.fridge],
      }
    })
  }, [])

  const deleteFridgeItem = useCallback((id: string) => {
    setState((s) => ({ ...s, fridge: s.fridge.filter((f) => f.id !== id) }))
  }, [])

  const adjustFridgeQty = useCallback((id: string, delta: number) => {
    setState((s) => ({
      ...s,
      fridge: s.fridge
        .map((f) => (f.id === id ? { ...f, qty: Math.max(0, Math.round((f.qty + delta) * 100) / 100) } : f))
        .filter((f) => f.qty > 0),
    }))
  }, [])

  const toggleShopChecked = useCallback((item: DerivedShoppingItem) => {
    setState((s) => {
      if (item.source === 'manual') {
        return {
          ...s,
          manualShopping: s.manualShopping.map((m) =>
            m.id === item.id ? { ...m, checked: !m.checked } : m,
          ),
        }
      }
      const has = s.checkedAuto.includes(item.key)
      return {
        ...s,
        checkedAuto: has ? s.checkedAuto.filter((k) => k !== item.key) : [...s.checkedAuto, item.key],
      }
    })
  }, [])

  const addManualShop = useCallback((name: string, qty: number, unit: Unit) => {
    if (!name.trim()) return
    setState((s) => ({
      ...s,
      manualShopping: [
        { id: uid(), name: name.trim(), qty, unit, checked: false, manual: true },
        ...s.manualShopping,
      ],
    }))
  }, [])

  const deleteManualShop = useCallback((id: string) => {
    setState((s) => ({ ...s, manualShopping: s.manualShopping.filter((m) => m.id !== id) }))
  }, [])

  const stockChecked = useCallback((checked: DerivedShoppingItem[]) => {
    if (checked.length === 0) return 0
    setState((s) => {
      const { fridge } = mergeIntoFridge(s.fridge, checked)
      const checkedManualIds = new Set(checked.filter((c) => c.source === 'manual').map((c) => c.id))
      const checkedAutoKeys = new Set(checked.filter((c) => c.source === 'auto').map((c) => c.key))
      return {
        ...s,
        fridge,
        manualShopping: s.manualShopping.filter((m) => !checkedManualIds.has(m.id)),
        checkedAuto: s.checkedAuto.filter((k) => !checkedAutoKeys.has(k)),
      }
    })
    return checked.length
  }, [])

  const resetAll = useCallback(() => setState(seed()), [])

  const value = useMemo<Store>(
    () => ({
      state,
      status,
      user,
      offline,
      login,
      logout,
      reload: boot,
      saveMeal,
      deleteMeal,
      toggleCooked,
      saveFridgeItem,
      deleteFridgeItem,
      adjustFridgeQty,
      toggleShopChecked,
      addManualShop,
      deleteManualShop,
      stockChecked,
      resetAll,
    }),
    [
      state,
      status,
      user,
      offline,
      login,
      logout,
      boot,
      saveMeal,
      deleteMeal,
      toggleCooked,
      saveFridgeItem,
      deleteFridgeItem,
      adjustFridgeQty,
      toggleShopChecked,
      addManualShop,
      deleteManualShop,
      stockChecked,
      resetAll,
    ],
  )

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
