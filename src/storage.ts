import type { WellnessStore } from './types'

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
  if (!raw) return structuredClone(defaultStore)

  try {
    const parsed = JSON.parse(raw) as WellnessStore
    return {
      preferences: {
        ...defaultStore.preferences,
        ...parsed.preferences,
        goals: {
          ...defaultStore.preferences.goals,
          ...parsed.preferences?.goals,
        },
      },
      entries: parsed.entries ?? defaultStore.entries,
    }
  } catch {
    return structuredClone(defaultStore)
  }
}

export function saveStore(store: WellnessStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}
