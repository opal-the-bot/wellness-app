import type { LogEntry, ParseResult, UserPreferences, WellnessStore } from './types'
import { defaultStore } from './storage'
import { parseDraft } from './parser'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export function hasServerBackend() {
  return Boolean(API_BASE)
}

export async function fetchRemoteStore(): Promise<WellnessStore> {
  if (!hasServerBackend()) return defaultStore
  return requestJson<WellnessStore>('/api/store')
}

export async function saveRemoteEntry(entry: LogEntry): Promise<LogEntry> {
  if (!hasServerBackend()) {
    return { ...entry, source: 'local' }
  }

  return requestJson<LogEntry>('/api/logs', {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export async function saveRemotePreferences(preferences: UserPreferences): Promise<UserPreferences> {
  if (!hasServerBackend()) {
    return preferences
  }

  return requestJson<UserPreferences>('/api/preferences', {
    method: 'POST',
    body: JSON.stringify(preferences),
  })
}

export async function parseDraftOnServer(detail: string): Promise<ParseResult> {
  if (!hasServerBackend()) {
    return {
      entries: parseDraft(detail).map((entry) => ({ ...entry, source: 'local' })),
      source: 'local',
    }
  }

  return requestJson<ParseResult>('/api/parse', {
    method: 'POST',
    body: JSON.stringify({ detail }),
  })
}
