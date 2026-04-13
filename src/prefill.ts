import type { LogEntry } from './storage'

type PrefillResult = {
  type: LogEntry['type']
  calories?: string
  protein?: string
  sugar?: string
  strength?: string
  cardio?: string
}

export function inferPrefill(input: string): PrefillResult {
  const text = input.toLowerCase()

  const hasWorkout = /workout|gym|lift|lifting|run|cardio|pilates|walk/.test(text)
  const hasSymptom = /bloated|bloating|dizzy|light.?headed|headache|cramp|pain|tired|can't sleep|insomnia/.test(text)
  const hasSupplement = /magnesium|vitamin|supplement|tablet|capsule/.test(text)

  let type: LogEntry['type'] = 'note'
  if (hasWorkout) type = 'workout'
  else if (hasSymptom) type = 'symptom'
  else if (hasSupplement) type = 'supplement'
  else if (text.trim()) type = 'meal'

  const result: PrefillResult = { type }

  if (/coffee|latte|matcha/.test(text)) result.calories = '120'
  if (/salad/.test(text)) result.calories = result.calories ?? '350'
  if (/fries/.test(text)) result.calories = '300'
  if (/chicken/.test(text)) result.protein = '35'
  if (/honey/.test(text)) result.sugar = '8'
  if (/run|cardio|walk/.test(text)) result.cardio = '30'
  if (/lift|lifting|gym|strength|pilates/.test(text)) result.strength = '45'

  return result
}
