import type { LogEntry, ParseResult, UserPreferences, WellnessStore } from './types'
import { defaultStore } from './storage'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const API_ORIGIN = API_BASE || ''

class ApiRequestError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_ORIGIN}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    })
  } catch {
    throw new ApiRequestError('Network request failed')
  }

  if (!response.ok) {
    throw new ApiRequestError(`Request failed: ${response.status}`, response.status)
  }

  return (await response.json()) as T
}

async function requestJsonWithFallback<T>(
  path: string,
  fallback: () => T | Promise<T>,
  init?: RequestInit,
): Promise<T> {
  try {
    return await requestJson<T>(path, init)
  } catch (error) {
    if (error instanceof ApiRequestError && typeof error.status === 'number' && error.status !== 404) {
      throw error
    }

    return await fallback()
  }
}

export function hasServerBackend() {
  return true
}

export async function fetchRemoteStore(): Promise<WellnessStore> {
  return requestJsonWithFallback('/api/store', () => defaultStore)
}

export async function saveRemoteEntry(entry: LogEntry): Promise<LogEntry> {
  const saved = await requestJsonWithFallback('/api/logs', () => ({ ...entry, source: 'local' as const }), {
    method: 'POST',
    body: JSON.stringify(entry),
  })
  return saved as LogEntry
}

export async function saveRemotePreferences(preferences: UserPreferences): Promise<UserPreferences> {
  return requestJsonWithFallback('/api/preferences', () => preferences, {
    method: 'POST',
    body: JSON.stringify(preferences),
  })
}

export async function parseDraftOnServer(detail: string): Promise<ParseResult> {
  return requestJsonWithFallback(
    '/api/parse',
    () => ({
      entries: [
        {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          type: 'note',
          title: 'Voice log',
          detail,
          source: 'local',
        },
      ],
      source: 'local',
    }),
    {
      method: 'POST',
      body: JSON.stringify({ detail }),
    },
  )
}
