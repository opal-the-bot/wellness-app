type MetricImpact = Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio', number>>

type LogEntry = {
  id: string
  createdAt: string
  type: 'meal' | 'symptom' | 'workout' | 'supplement' | 'note'
  title: string
  detail: string
  metricImpact?: MetricImpact
  source?: 'local' | 'server'
}

type WellnessPreferences = {
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

type WellnessStore = {
  preferences: WellnessPreferences
  entries: LogEntry[]
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WELLNESS_USER_ID = process.env.WELLNESS_USER_ID ?? 'ela'

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

async function supabaseFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env missing')
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase request failed: ${response.status} ${text}`)
  }

  return response
}

export async function readSupabaseStore(): Promise<WellnessStore | null> {
  if (!hasSupabaseConfig()) return null

  const [preferencesResponse, entriesResponse] = await Promise.all([
    supabaseFetch(`wellness_preferences?user_id=eq.${encodeURIComponent(WELLNESS_USER_ID)}&select=*`),
    supabaseFetch(`wellness_entries?user_id=eq.${encodeURIComponent(WELLNESS_USER_ID)}&select=*&order=created_at.desc`),
  ])

  const preferencesRows = (await preferencesResponse.json()) as Array<{
    dashboard_metrics: string[]
    calorie_mode: 'daily' | 'weekly'
    goals: WellnessStore['preferences']['goals']
  }>

  const entryRows = (await entriesResponse.json()) as Array<{
    id: string
    created_at: string
    entry_type: LogEntry['type']
    title: string
    detail: string
    metric_impact: MetricImpact
    source: 'local' | 'server'
  }>

  const preferences = preferencesRows[0] ?? {
    dashboard_metrics: ['Calories today', 'Protein today', 'Sugar today'],
    calorie_mode: 'daily' as const,
    goals: {
      calories: 1700,
      protein: 110,
      sugar: 35,
      strengthMinutes: 150,
      cardioMinutes: 90,
    },
  }

  return {
    preferences: {
      dashboardMetrics: preferences.dashboard_metrics,
      calorieMode: preferences.calorie_mode,
      goals: preferences.goals,
    },
    entries: entryRows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      type: row.entry_type,
      title: row.title,
      detail: row.detail,
      metricImpact: row.metric_impact,
      source: row.source,
    })),
  }
}

export async function insertSupabaseEntry(entry: LogEntry): Promise<LogEntry | null> {
  if (!hasSupabaseConfig()) return null

  const response = await supabaseFetch('wellness_entries', {
    method: 'POST',
    body: JSON.stringify({
      id: entry.id,
      user_id: WELLNESS_USER_ID,
      created_at: entry.createdAt,
      entry_type: entry.type,
      title: entry.title,
      detail: entry.detail,
      metric_impact: entry.metricImpact ?? {},
      source: 'server',
    }),
  })

  const [row] = (await response.json()) as Array<{
    id: string
    created_at: string
    entry_type: LogEntry['type']
    title: string
    detail: string
    metric_impact: MetricImpact
    source: 'local' | 'server'
  }>

  return {
    id: row.id,
    createdAt: row.created_at,
    type: row.entry_type,
    title: row.title,
    detail: row.detail,
    metricImpact: row.metric_impact,
    source: row.source,
  }
}

export async function upsertSupabasePreferences(preferences: WellnessPreferences): Promise<WellnessPreferences | null> {
  if (!hasSupabaseConfig()) return null

  const response = await supabaseFetch('wellness_preferences?on_conflict=user_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: WELLNESS_USER_ID,
      dashboard_metrics: preferences.dashboardMetrics,
      calorie_mode: preferences.calorieMode,
      goals: preferences.goals,
    }),
  })

  const [row] = (await response.json()) as Array<{
    dashboard_metrics: string[]
    calorie_mode: 'daily' | 'weekly'
    goals: WellnessPreferences['goals']
  }>

  return {
    dashboardMetrics: row.dashboard_metrics,
    calorieMode: row.calorie_mode,
    goals: row.goals,
  }
}
