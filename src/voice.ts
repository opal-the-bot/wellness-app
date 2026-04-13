type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition

export function getSpeechRecognition(): BrowserSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const win = window as Window & {
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor
    SpeechRecognition?: BrowserSpeechRecognitionCtor
  }
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}
