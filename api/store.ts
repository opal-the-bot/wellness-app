import { applyWellnessApiHeaders, type ApiRequest, type ApiResponse } from './_lib/http'
import { readStore } from './_lib/localStore'
import { readSupabaseStore } from './_lib/supabase'

function mergeStores(
  localStore: Awaited<ReturnType<typeof readStore>>,
  remoteStore: Awaited<ReturnType<typeof readSupabaseStore>>,
) {
  if (!remoteStore) return localStore

  const remoteEntries = remoteStore.entries ?? []
  const localEntries = localStore.entries ?? []
  const mergedEntries = [...remoteEntries]
  const seenIds = new Set(remoteEntries.map((entry) => entry.id))

  for (const entry of localEntries) {
    if (seenIds.has(entry.id)) continue
    mergedEntries.push(entry)
  }

  return {
    preferences: {
      ...remoteStore.preferences,
      ...localStore.preferences,
      goals: {
        ...remoteStore.preferences.goals,
        ...localStore.preferences.goals,
      },
    },
    entries: mergedEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }
}

export default async function handler(_req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)
  const [remoteStore, localStore] = await Promise.all([readSupabaseStore(), readStore()])
  const store = mergeStores(localStore, remoteStore)
  res.status(200).json(store)
}
