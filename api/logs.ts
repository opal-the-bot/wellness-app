import { applyWellnessApiHeaders, type ApiRequest, type ApiResponse } from './_lib/http'
import { appendEntry } from './_lib/localStore'
import { insertSupabaseEntry } from './_lib/supabase'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const entry = req.body as Record<string, unknown>
  if (!entry?.id || !entry?.createdAt || !entry?.title || !entry?.detail || !entry?.type) {
    return res.status(400).json({ error: 'Missing required entry fields' })
  }

  const saved = await insertSupabaseEntry(entry as never).catch(() => null)
  if (saved) {
    return res.status(200).json(saved)
  }

  const fallback = await appendEntry(entry as never)
  return res.status(200).json(fallback)
}
