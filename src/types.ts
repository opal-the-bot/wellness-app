export type MetricImpact = Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio', number>>

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
  metricImpact?: MetricImpact
  source?: 'local' | 'server'
}

export type WellnessStore = {
  preferences: UserPreferences
  entries: LogEntry[]
}

export type ParseResult = {
  entries: LogEntry[]
  source: 'local' | 'server'
}
