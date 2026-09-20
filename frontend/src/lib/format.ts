export const METRES_PER_MILE = 1609.344

export const milesToMetres = (miles: number) => miles * METRES_PER_MILE
export const metresToMiles = (metres: number) => metres / METRES_PER_MILE

/** "3.2 miles" — one decimal is as precise as anyone strolling actually cares about. */
export function formatMiles(miles: number) {
  return `${miles.toFixed(1)} ${miles === 1 ? 'mile' : 'miles'}`
}

/** A rough, friendly pace: 20 minutes per mile. */
export function estimateMinutes(miles: number) {
  return Math.round(miles * 20)
}

/** "1 hr 4 mins" / "35 mins" */
export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} hr`)
  if (minutes > 0 || hours === 0) parts.push(`${minutes} min${minutes === 1 ? '' : 's'}`)
  return parts.join(' ')
}
