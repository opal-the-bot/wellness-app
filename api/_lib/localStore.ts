import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

type MetricImpact = Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio', number>>

type UserPreferences = {
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

type LogEntry = {
  id: string
  createdAt: string
  type: 'meal' | 'symptom' | 'workout' | 'supplement' | 'note'
  title: string
  detail: string
  metricImpact?: MetricImpact
  source?: 'local' | 'server'
}

type WellnessStore = {
  preferences: UserPreferences
  entries: LogEntry[]
}

const defaultStore: WellnessStore = {
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
  entries: [],
}

const DATA_PATH = join(process.cwd(), '.data', 'wellness-store.json')

export async function readStore(): Promise<WellnessStore> {
  try {
    const raw = await readFile(DATA_PATH, 'utf8')
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
      entries: parsed.entries ?? [],
    }
  } catch {
    return structuredClone(defaultStore)
  }
}

export async function writeStore(store: WellnessStore) {
  await mkdir(dirname(DATA_PATH), { recursive: true })
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2), 'utf8')
}

export async function appendEntry(entry: LogEntry): Promise<LogEntry> {
  const store = await readStore()
  const existing = store.entries.find((currentEntry) => currentEntry.id === entry.id)
  if (existing) {
    return existing
  }

  const saved = { ...entry, source: 'local' as const }
  store.entries = [saved, ...store.entries]
  await writeStore(store)
  return saved
}
