import type { LogEntry } from './storage'
import { inferPrefill } from './prefill'

export function parseDraft(detail: string): LogEntry[] {
  const chunks = detail
    .split(/(?:\band then\b|\bthen\b|\balso\b|\, then\b|\.)/i)
    .map((part) => part.trim())
    .filter(Boolean)

  return chunks.map((chunk, index) => {
    const inferred = inferPrefill(chunk)
    return {
      id: `draft-${index}-${chunk.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      type: inferred.type,
      title:
        inferred.type === 'meal'
          ? 'Meal logged'
          : inferred.type === 'workout'
            ? 'Workout logged'
            : inferred.type === 'symptom'
              ? 'Symptom noted'
              : inferred.type === 'supplement'
                ? 'Supplement logged'
                : 'Note logged',
      detail: chunk,
      metricImpact: {
        calories: Number(inferred.calories) || 0,
        protein: Number(inferred.protein) || 0,
        sugar: Number(inferred.sugar) || 0,
        strength: Number(inferred.strength) || 0,
        cardio: Number(inferred.cardio) || 0,
      },
    }
  })
}
