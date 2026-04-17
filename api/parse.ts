import { applyWellnessApiHeaders, getSecret, parseJsonBody, type ApiRequest, type ApiResponse } from './_lib/http'
import { validateLogEntry } from './_lib/validation'

type ParsedEntry = {
  type: 'meal' | 'symptom' | 'workout' | 'supplement' | 'note'
  title: string
  detail: string
  metricImpact?: Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio' | 'drinks' | 'sleep', number>>
}

function asEntryArray(value: unknown): ParsedEntry[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null
      const candidate = entry as Record<string, unknown>
      const validated = validateLogEntry({
        id: `parsed-${index}`,
        createdAt: new Date().toISOString(),
        type: candidate.type,
        title: candidate.title,
        detail: candidate.detail,
        metricImpact: candidate.metricImpact,
        source: 'server',
      })

      if (!validated) return null

      const { id: _id, createdAt: _createdAt, source: _source, ...rest } = validated
      return rest
    })
    .filter((entry): entry is ParsedEntry => Boolean(entry))
}

function fallbackParse(detail: string): ParsedEntry[] {
  const text = detail.toLowerCase()

  if (/run|running|walk|walking|gym|lift|workout|pilates|yoga/.test(text)) {
    return [
      {
        type: 'workout',
        title: 'Workout logged',
        detail,
        metricImpact: {
          cardio: /run|running|walk|walking/.test(text) ? 30 : undefined,
          strength: /gym|lift|pilates|yoga|workout/.test(text) ? 45 : undefined,
        },
      },
    ]
  }

  if (/coffee|latte|espresso|breakfast|lunch|dinner|salad|sandwich|pasta|eggs?|toast/.test(text)) {
    return [
      {
        type: 'meal',
        title: 'Meal logged',
        detail,
        metricImpact: {
          calories: /coffee|espresso/.test(text) ? 5 : 400,
          protein: /eggs?|chicken/.test(text) ? 20 : undefined,
          sugar: /latte/.test(text) ? 12 : undefined,
        },
      },
    ]
  }

  return [{ type: 'note', title: 'Voice log', detail }]
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  applyWellnessApiHeaders(res)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = parseJsonBody<Record<string, unknown>>(req.body)
  const detail = typeof body?.detail === 'string' ? body.detail.trim() : typeof body?.transcript === 'string' ? body.transcript.trim() : ''

  if (!detail) {
    return res.status(400).json({ error: 'Missing detail' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY || (await getSecret('OPENROUTER_API_KEY'))
  if (!apiKey) {
    return res.status(200).json({ entries: fallbackParse(detail), source: 'local', reason: 'missing_openrouter_key' })
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://body-log-opals-projects-cfd61e07.vercel.app',
        'X-Title': 'Summit Wellness App',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free',
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              'Parse the user input into structured wellness log entries. Return JSON only with shape {"entries":[{"type":"meal|symptom|workout|supplement|note","title":"short title","detail":"full detail","metricImpact":{"calories":number,"protein":number,"sugar":number,"strength":number,"cardio":number}}]}. Use null or omit uncertain metrics. No markdown.',
          },
          {
            role: 'user',
            content: detail,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(200).json({
        entries: fallbackParse(detail),
        source: 'local',
        reason: 'openrouter_error',
        status: response.status,
        error: errorText.slice(0, 400),
      })
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    const entries = asEntryArray((parsed as { entries?: unknown }).entries)

    if (!entries.length) {
      return res.status(200).json({ entries: fallbackParse(detail), source: 'local', reason: 'empty_ai_result' })
    }

    return res.status(200).json({ entries, source: 'server' })
  } catch (error) {
    return res.status(200).json({
      entries: fallbackParse(detail),
      source: 'local',
      reason: 'parse_exception',
      error: error instanceof Error ? error.message : 'unknown_error',
    })
  }
}
