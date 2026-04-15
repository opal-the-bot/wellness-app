import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { loadStore, saveStore } from './storage'
import { inferPrefill } from './prefill'
import type { LogEntry, WellnessStore } from './types'

function App() {
  const [store, setStore] = useState<WellnessStore>(() => loadStore())
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [justLogged, setJustLogged] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    saveStore(store)
  }, [store])

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

  const saveEntry = (text: string) => {
    if (!text.trim()) return
    const inferred = inferPrefill(text)
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: inferred.type ?? 'meal',
      title: text.slice(0, 60),
      detail: text,
      metricImpact: {
        calories: Number(inferred.calories) || 0,
        protein: Number(inferred.protein) || 0,
        sugar: Number(inferred.sugar) || 0,
        strength: Number(inferred.strength) || 0,
        cardio: Number(inferred.cardio) || 0,
      },
      source: 'local',
    }
    setStore((prev) => ({
      ...prev,
      entries: [entry, ...prev.entries],
    }))
    const cal = entry.metricImpact?.calories
    setJustLogged(cal && cal > 0 ? `Logged · ~${cal} cal` : 'Logged ✓')
    setTranscript('')
    setTimeout(() => setJustLogged(null), 3000)
  }

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatusMsg("Voice isn't supported in this browser. Try Safari on iOS or Chrome.")
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
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(final || interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      setStatusMsg('')
      const current = recognitionRef.current
      if (current?._finalTranscript) {
        saveEntry(current._finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setStatusMsg(event.error === 'not-allowed'
        ? 'Microphone access denied. Check your browser settings.'
        : 'Something went wrong. Tap to try again.')
    }

    // Patch to capture final transcript before onend fires
    const originalOnResult = recognition.onresult
    recognition.onresult = (event: any) => {
      originalOnResult?.(event)
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        }
      }
      if (final) recognition._finalTranscript = final
    }

    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleManualLog = () => {
    if (transcript.trim()) {
      saveEntry(transcript)
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
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {isListening && <p className="status-text listening-pulse">Listening…</p>}
          {!isListening && statusMsg && <p className="status-text">{statusMsg}</p>}
          {justLogged && <div className="ai-response-card"><p className="ai-response">{justLogged}</p></div>}

          {transcript && (
            <div className="transcript-box">
              <p className="transcript-text">{transcript}</p>
              {!isListening && (
                <button className="log-btn" onClick={handleManualLog}>Log this →</button>
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
      </div>
    </div>
  )
}

export default App
