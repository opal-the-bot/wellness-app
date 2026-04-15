import type { LogEntry } from './types'

type PrefillResult = {
  type: LogEntry['type']
  calories?: string
  protein?: string
  sugar?: string
  strength?: string
  cardio?: string
}

/** Extract an explicit duration in minutes from phrases like "40 min", "1 hour", "30 minutes" */
function extractDurationMinutes(text: string): number | null {
  // e.g. "40 min", "40-minute", "40 minutes"
  const minMatch = text.match(/(\d+)\s*(?:min(?:ute)?s?|mins?)/i)
  if (minMatch) return parseInt(minMatch[1], 10)
  // e.g. "1 hour", "1.5 hours", "2 hrs"
  const hrMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i)
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60)
  return null
}

export function inferPrefill(input: string): PrefillResult {
  const text = input.toLowerCase()

  const hasWorkout = /workout|gym|lift|lifting|strength|weights|run|running|jog|jogging|cycle|cycling|bike|cardio|pilates|yoga|walk|walking|hiit|crossfit|rowing|swim|swimming/.test(text)
  const hasSymptom = /bloated|bloating|dizzy|light.?headed|headache|migraine|cramp|cramps|pain|nausea|tired|fatigued|exhausted|can't sleep|insomnia|anxious|anxiety|stressed|stress|sore|aching/.test(text)
  const hasSupplement = /magnesium|vitamin|supplement|tablet|capsule|creatine|electrolyte|omega.?3|probiotic|collagen|zinc|iron|b12|ashwagandha/.test(text)
  const hasMeal = /ate|eat|meal|breakfast|lunch|dinner|snack|coffee|latte|matcha|tea|salad|fries|chicken|rice|toast|eggs?|protein shake|smoothie|pasta|sushi|pizza|burger|sandwich|wrap|oats|oatmeal|yogurt|avocado|salmon|tuna|steak|soup|bowl|granola|pancakes?|waffle|fruit|apple|banana|bar|chocolate|cookie|cake|bread|cheese|milk/.test(text)

  let type: LogEntry['type'] = 'note'
  if (hasWorkout) type = 'workout'
  else if (hasSymptom) type = 'symptom'
  else if (hasSupplement) type = 'supplement'
  else if (hasMeal || text.trim()) type = 'meal'

  const result: PrefillResult = { type }

  // ── Cardio: use explicit duration if present, else default estimate ──
  if (/run|running|jog|jogging|cardio|cycle|cycling|bike|hiit|rowing|swim|swimming/.test(text)) {
    result.cardio = String(extractDurationMinutes(text) ?? 30)
  }
  if (/walk|walking/.test(text)) {
    result.cardio = result.cardio ?? String(extractDurationMinutes(text) ?? 20)
  }

  // ── Strength: use explicit duration if present, else default estimate ──
  if (/lift|lifting|gym|strength|weights|pilates|yoga|crossfit/.test(text)) {
    result.strength = String(extractDurationMinutes(text) ?? 45)
  }

  // Broad workout fallback (covers "workout" / "exercise" without specific type)
  if (hasWorkout && !result.cardio && !result.strength) {
    const dur = extractDurationMinutes(text)
    if (dur) {
      // Guess cardio vs strength by context; default to strength if no clue
      if (/cardio|run|cycle|swim/.test(text)) result.cardio = String(dur)
      else result.strength = String(dur)
    }
  }

  // ── Food: calories ──
  if (/coffee|latte|matcha/.test(text)) result.calories = result.calories ?? '120'
  if (/salad/.test(text)) result.calories = result.calories ?? '350'
  if (/fries/.test(text)) result.calories = result.calories ?? '300'
  if (/toast/.test(text)) result.calories = result.calories ?? '180'
  if (/smoothie/.test(text)) result.calories = result.calories ?? '280'
  if (/oats|oatmeal/.test(text)) result.calories = result.calories ?? '300'
  if (/yogurt/.test(text)) result.calories = result.calories ?? '150'
  if (/avocado/.test(text)) result.calories = result.calories ?? '230'
  if (/salmon/.test(text)) result.calories = result.calories ?? '350'
  if (/steak/.test(text)) result.calories = result.calories ?? '450'
  if (/pasta/.test(text)) result.calories = result.calories ?? '400'
  if (/pizza/.test(text)) result.calories = result.calories ?? '500'
  if (/burger/.test(text)) result.calories = result.calories ?? '500'
  if (/sandwich|wrap/.test(text)) result.calories = result.calories ?? '380'
  if (/soup/.test(text)) result.calories = result.calories ?? '200'
  if (/granola/.test(text)) result.calories = result.calories ?? '350'
  if (/pancakes?|waffle/.test(text)) result.calories = result.calories ?? '380'
  if (/chocolate/.test(text)) { result.calories = result.calories ?? '150'; result.sugar = result.sugar ?? '15' }
  if (/cookie|cake/.test(text)) { result.calories = result.calories ?? '200'; result.sugar = result.sugar ?? '18' }
  if (/honey/.test(text)) result.sugar = result.sugar ?? '8'
  if (/sushi/.test(text)) result.calories = result.calories ?? '400'
  if (/rice/.test(text)) result.calories = result.calories ?? '200'
  if (/bread/.test(text)) result.calories = result.calories ?? '160'
  if (/fruit|apple|banana/.test(text)) { result.calories = result.calories ?? '90'; result.sugar = result.sugar ?? '12' }

  // ── Food: protein ──
  if (/eggs?/.test(text)) result.protein = result.protein ?? '12'
  if (/chicken/.test(text)) result.protein = result.protein ?? '35'
  if (/protein shake/.test(text)) { result.protein = result.protein ?? '25'; result.calories = result.calories ?? '150' }
  if (/salmon|tuna/.test(text)) result.protein = result.protein ?? '30'
  if (/steak/.test(text)) result.protein = result.protein ?? '40'
  if (/yogurt/.test(text)) result.protein = result.protein ?? '10'
  if (/cheese/.test(text)) result.protein = result.protein ?? '7'
  if (/milk/.test(text)) result.protein = result.protein ?? '8'
  if (/oats|oatmeal/.test(text)) result.protein = result.protein ?? '6'

  return result
}
