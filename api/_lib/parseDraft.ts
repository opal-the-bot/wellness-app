type MetricImpact = Partial<Record<'calories' | 'protein' | 'sugar' | 'strength' | 'cardio', number>>

type LogEntry = {
  id: string
  createdAt: string
  type: 'meal' | 'symptom' | 'workout' | 'supplement' | 'note'
  title: string
  detail: string
  metricImpact?: MetricImpact
  source?: 'local' | 'server'
}

function inferPrefill(input: string) {
  const text = input.toLowerCase()

  const hasWorkout = /workout|gym|lift|lifting|strength|weights|run|running|jog|jogging|cycle|cycling|bike|cardio|pilates|yoga|walk|walking/.test(text)
  const hasSymptom = /bloated|bloating|dizzy|light.?headed|headache|migraine|cramp|cramps|pain|nausea|tired|fatigued|exhausted|can't sleep|insomnia|anxious|anxiety|stressed|stress/.test(text)
  const hasSupplement = /magnesium|vitamin|supplement|tablet|capsule|creatine|electrolyte|omega.?3|probiotic/.test(text)
  const hasMeal = /ate|eat|meal|breakfast|lunch|dinner|snack|coffee|latte|matcha|tea|salad|fries|chicken|rice|toast|eggs|protein shake|smoothie/.test(text)

  let type: LogEntry['type'] = 'note'
  if (hasWorkout) type = 'workout'
  else if (hasSymptom) type = 'symptom'
  else if (hasSupplement) type = 'supplement'
  else if (hasMeal || text.trim()) type = 'meal'

  const result: {
    type: LogEntry['type']
    calories?: string
    protein?: string
    sugar?: string
    strength?: string
    cardio?: string
  } = { type }

  if (/coffee|latte|matcha/.test(text)) result.calories = '120'
  if (/salad/.test(text)) result.calories = result.calories ?? '350'
  if (/fries/.test(text)) result.calories = '300'
  if (/toast/.test(text)) result.calories = result.calories ?? '220'
  if (/eggs?/.test(text)) result.protein = result.protein ?? '12'
  if (/chicken|protein shake/.test(text)) result.protein = '35'
  if (/smoothie/.test(text)) result.calories = result.calories ?? '250'
  if (/honey/.test(text)) result.sugar = '8'
  if (/run|running|jog|jogging|cardio|cycle|cycling|bike|walk|walking/.test(text)) result.cardio = '30'
  if (/lift|lifting|gym|strength|weights|pilates|yoga/.test(text)) result.strength = '45'

  return result
}

export function parseDraft(detail: string): LogEntry[] {
  const normalized = detail
    .replace(/\s+and\s+after\s+that\s+/gi, '. ')
    .replace(/\s+after\s+that\s+/gi, '. ')
    .replace(/\s+and\s+then\s+/gi, '. ')
    .replace(/\s+then\s+/gi, '. ')
    .replace(/\s+also\s+/gi, '. ')

  const chunks = normalized
    .split(/(?:[.!?]\s+|\n+|\, then\b)/i)
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
      source: 'server',
    }
  })
}
