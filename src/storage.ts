export type UserPreferences = {
  dashboardMetrics: string[]
  calorieMode: 'daily' | 'weekly'
  goals: {
    calories: number
    protein: number
    sugar: number
    strengthMinutes: number
    cardioMinutes: number
  }
}

export type LogEntry = {
  id: string
  createdAt: string
  type: 'meal' | 'symptom' | 'workout' | 'supplement' | 'note'
  title: string
  detail: string
  metricImpact?: Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio', number>>
}

export type WellnessStore = {
  preferences: UserPreferences
  entries: LogEntry[]
}

const STORAGE_KEY = 'wellness-app-store'

export const defaultStore: WellnessStore = {
  preferences: {
    dashboardMetrics: ['Calories today', 'Protein today', 'Sugar today'],
    calorieMode: 'daily',
    goals: {
      calories: 1700,
      protein: 110,
      sugar: 35,
      strengthMinutes: 150,
      cardioMinutes: 90,
    },
  },
  entries: [
    {
      id: 'seed-lunch',
      createdAt: new Date().toISOString(),
      type: 'meal',
      title: 'Lunch logged',
      detail: 'Chicken salad and fries · estimated 642 cal',
      metricImpact: { calories: 642, protein: 38, sugar: 4 },
    },
  ],
}

export function loadStore(): WellnessStore {
  if (typeof window === 'undefined') return defaultStore

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultStore

  try {
    return JSON.parse(raw) as WellnessStore
  } catch {
    return defaultStore
  }
}

export function saveStore(store: WellnessStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}
