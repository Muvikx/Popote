import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppState, Dish, FridgeItem, Meal, Slot, Unit } from './types'
import { mergeIntoFridge, type DerivedShoppingItem } from './lib/shopping'
import { apiGetState, apiLogin, apiLogout, apiPutState } from './lib/api'

const CACHE_KEY = 'popote:cache'
const SAVE_DEBOUNCE = 800

function uid() {
  return crypto.randomUUID()
}

const EMPTY: AppState = { meals: [], fridge: [], dishes: [], manualShopping: [], checkedAuto: [] }

function normalize(s: Partial<AppState> | null | undefined): AppState {
  return {
    meals: s?.meals ?? [],
    fridge: s?.fridge ?? [],
    dishes: s?.dishes ?? [],
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
  moveMeal: (id: string, date: string, slot: Slot) => void
  saveDish: (dish: Dish) => void
  deleteDish: (id: string) => void
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
      skipNextSave.current = true // don't immediately re-PUT what we just fetched
      setState(normalize(res.data))
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

  const moveMeal = useCallback((id: string, date: string, slot: Slot) => {
    setState((s) => ({
      ...s,
      meals: s.meals.map((m) => (m.id === id ? { ...m, date, slot } : m)),
    }))
  }, [])

  const saveDish = useCallback((dish: Dish) => {
    setState((s) => {
      const exists = s.dishes.some((d) => d.id === dish.id)
      return {
        ...s,
        dishes: exists ? s.dishes.map((d) => (d.id === dish.id ? dish : d)) : [dish, ...s.dishes],
      }
    })
  }, [])

  const deleteDish = useCallback((id: string) => {
    setState((s) => ({ ...s, dishes: s.dishes.filter((d) => d.id !== id) }))
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

  const resetAll = useCallback(() => setState(EMPTY), [])

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
      moveMeal,
      saveDish,
      deleteDish,
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
      moveMeal,
      saveDish,
      deleteDish,
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
