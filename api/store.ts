import { applyWellnessApiHeaders, type ApiRequest, type ApiResponse } from './_lib/http'
import { readStore } from './_lib/localStore'
import { hasSupabaseConfig, readSupabaseStore } from './_lib/supabase'

function mergeStores(
  localStore: Awaited<ReturnType<typeof readStore>>,
  remoteStore: Awaited<ReturnType<typeof readSupabaseStore>>,
) {
  if (!remoteStore) return localStore

  const remoteEntries = remoteStore.entries ?? []
  const localEntries = localStore.entries ?? []
  const mergedEntries = [...remoteEntries]
  const seenIds = new Set<string>(remoteEntries.map((entry: { id: string }) => entry.id))

  for (const entry of localEntries) {
    if (seenIds.has(entry.id)) continue
    mergedEntries.push(entry)
  }

  const localGoals = localStore.preferences?.goals ?? {}
  const remoteGoals = remoteStore.preferences?.goals ?? {}

  return {
    preferences: {
      ...localStore.preferences,
      ...remoteStore.preferences,
      dashboardMetrics:
        remoteStore.preferences?.dashboardMetrics?.length
          ? remoteStore.preferences.dashboardMetrics
          : localStore.preferences.dashboardMetrics,
      calorieMode: remoteStore.preferences?.calorieMode ?? localStore.preferences.calorieMode,
      goals: {
        ...localGoals,
        ...remoteGoals,
      },
    },
    entries: mergedEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const localStore = await readStore()

  if (!hasSupabaseConfig()) {
    res.setHeader('X-Wellness-Backend', 'local-only')
    return res.status(200).json(localStore)
  }

  try {
    const remoteStore = await readSupabaseStore()
    const store = mergeStores(localStore, remoteStore)
    res.setHeader('X-Wellness-Backend', remoteStore ? 'supabase' : 'local-fallback')
    return res.status(200).json(store)
  } catch {
    res.setHeader('X-Wellness-Backend', 'supabase-error')
    return res.status(503).json({ error: 'Supabase read failed' })
  }
}
