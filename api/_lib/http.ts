import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type ApiRequest = {
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

export type ApiResponse = {
  status(code: number): ApiResponse
  json(payload: unknown): void
  setHeader(name: string, value: string): void
}

export async function getSecret(name: string): Promise<string | null> {
  try {
    const path = join(process.cwd(), '.secrets', 'keys.env')
    const content = await readFile(path, 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith('#')) continue
      const [key, ...rest] = line.split('=')
      if (key?.trim() === name) return rest.join('=').trim()
    }
    return null
  } catch {
    return null
  }
}

export function parseJsonBody<T>(body: unknown): T | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T
    } catch {
      return null
    }
  }

  if (body && typeof body === 'object') return body as T
  return null
}

export function applyWellnessApiHeaders(res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Vary', 'Authorization')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
}
