import { applyWellnessApiHeaders, type ApiRequest, type ApiResponse } from './_lib/http'
import { readStore, writeStore } from './_lib/localStore'
import { upsertSupabasePreferences } from './_lib/supabase'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (req.body ?? {}) as {
    dashboardMetrics?: unknown
    calorieMode?: unknown
    goals?: unknown
  }

  if (!Array.isArray(body.dashboardMetrics) || (body.calorieMode !== 'daily' && body.calorieMode !== 'weekly') || typeof body.goals !== 'object' || !body.goals) {
    return res.status(400).json({ error: 'Invalid preferences payload' })
  }

  const preferences: {
    dashboardMetrics: string[]
    calorieMode: 'daily' | 'weekly'
    goals: {
      calories: number
      protein: number
      sugar: number
      strengthMinutes: number
      cardioMinutes: number
    }
  } = {
    dashboardMetrics: body.dashboardMetrics as string[],
    calorieMode: body.calorieMode,
    goals: body.goals as {
      calories: number
      protein: number
      sugar: number
      strengthMinutes: number
      cardioMinutes: number
    },
  }

  const saved = await upsertSupabasePreferences(preferences).catch(() => null)
  if (saved) {
    return res.status(200).json(saved)
  }

  const store = await readStore()
  store.preferences = preferences
  await writeStore(store)
  return res.status(200).json(store.preferences)
}
