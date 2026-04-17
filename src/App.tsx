import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadStore, saveStore } from './storage'
import { parseDraftOnServer } from './server'
import type { LogEntry, WellnessStore } from './types'

function App() {
  const [store, setStore] = useState<WellnessStore>(() => loadStore())
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [justLogged, setJustLogged] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>(['App loaded', 'Ready to log'])
  const recognitionRef = useRef<any>(null)

  const addLog = (msg: string) => {
    setLog((prev) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      return [`${time} · ${msg}`, ...prev.slice(0, 19)]
    })
  }

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    addLog('Storage loaded')
  }, [])

  const summary = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return store.entries.reduce(
      (acc, entry) => {
        const ts = new Date(entry.createdAt).getTime()
        if (ts >= todayStart) {
          acc.calories += entry.metricImpact?.calories ?? 0
          acc.protein += entry.metricImpact?.protein ?? 0
          acc.sugar += entry.metricImpact?.sugar ?? 0
        }
        return acc
      },
      { calories: 0, protein: 0, sugar: 0 },
    )
  }, [store.entries])

  const saveEntry = async (text: string) => {
    if (!text.trim()) return

    addLog(`Parsing: "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}"`)

    const parsed = await parseDraftOnServer(text)
    const base = parsed.entries[0]

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: base?.type ?? 'note',
      title: base?.title ?? 'Voice log',
      detail: base?.detail ?? text,
      metricImpact: base?.metricImpact ?? {},
      source: parsed.source,
    }

    setStore((prev) => ({
      ...prev,
      entries: [entry, ...prev.entries],
    }))

    addLog(`Saved via ${parsed.source}: ${entry.title}`)
    const cal = entry.metricImpact?.calories
    setJustLogged(cal && cal > 0 ? `Logged · ~${cal} cal` : 'Logged ✓')
    setTranscript('')
    setTimeout(() => setJustLogged(null), 3000)
  }

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setStatusMsg("Voice isn't supported in this browser. Try Safari on iPhone or Chrome.")
      addLog('Mic not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-GB'

    recognition.onstart = () => {
      setIsListening(true)
      setStatusMsg('Listening…')
      setTranscript('')
      addLog('Listening…')
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) final += result[0].transcript
        else interim += result[0].transcript
      }
      setTranscript(final || interim)
      if (final) recognition._finalTranscript = final
    }

    recognition.onend = () => {
      setIsListening(false)
      setStatusMsg('')
      addLog('Stopped listening')
      const current = recognitionRef.current
      if (current?._finalTranscript) {
        void saveEntry(current._finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setStatusMsg(
        event.error === 'not-allowed'
          ? 'Microphone access denied. Check browser settings.'
          : 'Something went wrong. Tap to try again.',
      )
      addLog(`Mic error: ${event.error}`)
    }

    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const toggleVoice = () => {
    if (isListening) stopListening()
    else startListening()
  }

  const handleManualLog = () => {
    if (transcript.trim()) {
      void saveEntry(transcript)
    }
  }

  return (
    <div className="app-wrapper">
      <div className="app">
        <div className="app-header">
          <h1>Summit</h1>
        </div>

        <div className="mic-section">
          <button
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleVoice}
            aria-label={isListening ? 'Stop recording' : 'Start voice log'}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {isListening && <p className="status-text listening-pulse">Listening…</p>}
          {!isListening && statusMsg && <p className="status-text">{statusMsg}</p>}
          {justLogged && (
            <div className="ai-response-card">
              <p className="ai-response">{justLogged}</p>
            </div>
          )}

          {transcript && (
            <div className="transcript-box">
              <p className="transcript-text">{transcript}</p>
              {!isListening && (
                <button className="log-btn" onClick={handleManualLog}>
                  Log this →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="stats-row">
          <div className="stat">
            <span className="stat-val">{summary.calories > 0 ? summary.calories : '–'}</span>
            <span className="stat-lbl">cal</span>
          </div>
          <div className="stat">
            <span className="stat-val">{summary.sugar > 0 ? `${summary.sugar}g` : '–'}</span>
            <span className="stat-lbl">sugar</span>
          </div>
          <div className="stat">
            <span className="stat-val">{summary.protein > 0 ? `${summary.protein}g` : '–'}</span>
            <span className="stat-lbl">protein</span>
          </div>
        </div>

        <div className="log-section">
          <p className="log-title">Debug log</p>
          <div className="log-list">
            {log.map((entry, i) => (
              <p key={i} className="log-entry">
                {entry}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
