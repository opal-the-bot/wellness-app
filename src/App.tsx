import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { defaultStore, loadStore, saveStore, type LogEntry, type WellnessStore } from './storage'

type StatCard = {
  label: string
  value: string
  hint: string
}

type TimelineItem = {
  time: string
  title: string
  detail: string
  tag: string
}

const statsPageCards: StatCard[] = [
  {
    label: 'Fasting window',
    value: '13h 20m',
    hint: 'Last meal 8:40 pm',
  },
  {
    label: 'Sleep hours',
    value: '7.4',
    hint: 'Bed 12:18 am · Up 7:44 am',
  },
  {
    label: 'Strength mins',
    value: '112',
    hint: 'Weekly goal 150 min',
  },
  {
    label: 'Cardio mins',
    value: '46',
    hint: 'Weekly goal 90 min',
  },
  {
    label: 'Alcoholic drinks',
    value: '2',
    hint: 'This week',
  },
]

const seedTimeline: TimelineItem[] = [
  {
    time: '08:10',
    title: 'Coffee logged',
    detail: 'Flat white with 1 tsp honey · estimated 112 cal',
    tag: 'Nutrition',
  },
  {
    time: '12:42',
    title: 'Lunch logged',
    detail: 'Chicken salad and fries · estimated 642 cal',
    tag: 'Nutrition',
  },
  {
    time: '14:05',
    title: 'Symptom noted',
    detail: 'Bloating logged after lunch',
    tag: 'Body',
  },
  {
    time: '18:30',
    title: 'Workout logged',
    detail: 'Lower body strength · 42 min · 5 exercises captured',
    tag: 'Training',
  },
  {
    time: '22:15',
    title: 'Supplement logged',
    detail: 'Magnesium glycinate saved to today',
    tag: 'Routine',
  },
]

function formatEntry(entry: LogEntry): TimelineItem {
  return {
    time: new Date(entry.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    title: entry.title,
    detail: entry.detail,
    tag:
      entry.type === 'meal'
        ? 'Nutrition'
        : entry.type === 'symptom'
          ? 'Body'
          : entry.type === 'workout'
            ? 'Training'
            : entry.type === 'supplement'
              ? 'Routine'
              : 'Note',
  }
}

function App() {
  const [store, setStore] = useState<WellnessStore>(() => loadStore())

  useEffect(() => {
    saveStore(store)
  }, [store])

  const timeline = useMemo(() => {
    if (store.entries.length === 0) return seedTimeline
    return [...store.entries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(formatEntry)
  }, [store.entries])

  const summary = useMemo(() => {
    return store.entries.reduce(
      (acc, entry) => {
        acc.calories += entry.metricImpact?.calories ?? 0
        acc.protein += entry.metricImpact?.protein ?? 0
        acc.sugar += entry.metricImpact?.sugar ?? 0
        acc.strength += entry.metricImpact?.strength ?? 0
        acc.cardio += entry.metricImpact?.cardio ?? 0
        return acc
      },
      { calories: 0, protein: 0, sugar: 0, strength: 0, cardio: 0 },
    )
  }, [store.entries])

  const dashboardStats: StatCard[] = [
    {
      label: 'Calories today',
      value: `${summary.calories || 1284}`,
      hint: `Goal ${store.preferences.goals.calories} · ${Math.max(store.preferences.goals.calories - summary.calories, 0) || 416} left`,
    },
    {
      label: 'Protein today',
      value: `${summary.protein || 86}g`,
      hint: `Goal ${store.preferences.goals.protein}g · ${Math.max(store.preferences.goals.protein - summary.protein, 0) || 24}g to go`,
    },
    {
      label: 'Sugar today',
      value: `${summary.sugar || 29}g`,
      hint: 'Tracked from logged meals',
    },
  ]

  const resetDemo = () => setStore(defaultStore)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Body intelligence</p>
          <h1>Body Log</h1>
        </div>
        <button className="ghost-button" onClick={resetDemo}>Reset demo</button>
      </header>

      <main className="phone-frame">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Voice first</p>
            <h2>Log what happened. Let the app structure it.</h2>
            <p className="hero-text">
              Tap once, speak naturally, and get clean tracking for calories,
              workouts, symptoms, supplements, sleep, and more.
            </p>
          </div>

          <div className="capture-card">
            <div className="capture-status-row">
              <span className="status-pill">Ready to log</span>
              <span className="status-meta">tap once to start · tap to stop</span>
            </div>

            <button className="record-button" aria-label="Start voice log">
              <span className="record-ring">
                <span className="record-core"></span>
              </span>
            </button>

            <div className="capture-toggle">
              <button className="toggle-chip active">Voice</button>
              <button className="toggle-chip">Chat</button>
            </div>

            <div className="assistant-response">
              <p className="assistant-label">Latest response</p>
              <p className="assistant-body">
                Lunch logged. Estimated 642 calories. Added chicken, fries, and
                post-meal bloating to today.
              </p>
              <div className="follow-up-box">
                <span>About what time did you have coffee this morning?</span>
                <div className="follow-up-actions">
                  <button>7–8 am</button>
                  <button>8–9 am</button>
                  <button>9–10 am</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h3>Your top widgets</h3>
            </div>
            <span className="section-note">Chosen during onboarding</span>
          </div>

          <div className="stats-grid primary">
            {dashboardStats.map((stat) => (
              <article key={stat.label} className="stat-card">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-hint">{stat.hint}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Today</p>
              <h3>Daily feed</h3>
            </div>
            <span className="section-note">Stored with weather + cycle context</span>
          </div>

          <div className="timeline-list">
            {timeline.map((item) => (
              <article key={`${item.time}-${item.title}`} className="timeline-item">
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-content">
                  <div className="timeline-header-row">
                    <p className="timeline-title">{item.title}</p>
                    <span className="timeline-tag">{item.tag}</span>
                  </div>
                  <p className="timeline-detail">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Stats</p>
              <h3>Everything else</h3>
            </div>
            <span className="section-note">Insights page comes later</span>
          </div>

          <div className="stats-grid secondary">
            {statsPageCards.map((stat) => (
              <article key={stat.label} className="stat-card muted">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-hint">{stat.hint}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block onboarding-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Onboarding</p>
              <h3>Data the app should learn up front</h3>
            </div>
          </div>

          <div className="onboarding-grid">
            <div className="onboarding-card">
              <h4>Profile + goals</h4>
              <ul>
                <li>Age</li>
                <li>Height / weight optional</li>
                <li>Calorie target daily or weekly</li>
                <li>Protein, sugar, fasting goals</li>
                <li>Strength + cardio goals</li>
              </ul>
            </div>
            <div className="onboarding-card">
              <h4>Health context</h4>
              <ul>
                <li>Conditions</li>
                <li>Medications</li>
                <li>Supplements and vitamins</li>
                <li>Cycle history + period dates</li>
                <li>Symptoms worth tracking</li>
              </ul>
            </div>
            <div className="onboarding-card">
              <h4>Reference library</h4>
              <ul>
                <li>Pantry photo uploads</li>
                <li>Brand-specific supplements</li>
                <li>Usual serving sizes</li>
                <li>Preferred foods and drinks</li>
                <li>Alcohol habits</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
