export type ApiRequest = {
  method?: string
  body?: unknown
}

export type ApiResponse = {
  status(code: number): ApiResponse
  json(payload: unknown): void
  setHeader(name: string, value: string): void
}

export function applyWellnessApiHeaders(res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Vary', 'Authorization')
}
