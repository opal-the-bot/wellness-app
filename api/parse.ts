import { applyWellnessApiHeaders, type ApiRequest, type ApiResponse } from './_lib/http'
import { parseDraft } from './_lib/parseDraft'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (req.body ?? {}) as { detail?: unknown }
  const detail = typeof body.detail === 'string' ? body.detail : ''
  if (!detail.trim()) {
    return res.status(400).json({ error: 'detail is required' })
  }

  const entries = parseDraft(detail)
  return res.status(200).json({ entries, source: 'server' })
}
