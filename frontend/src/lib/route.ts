export type LineStringFeature = {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: Record<string, unknown>
}

export type Waypoint = { lat: number; lon: number }

export type RouteResult = {
  geoJson: LineStringFeature
  requestedDistanceMeters: number
  actualDistanceMeters: number
  distanceErrorPercent: number
  estimatedDurationSeconds: number
  attemptCount: number
  waypoints: Waypoint[]
}

/** Accepts "lat, lon" — the same format the geolocation button writes into the field. */
export function parseLatLon(value: string): { lat: number; lon: number } | null {
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!match) return null

  const lat = Number(match[1])
  const lon = Number(match[2])
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

  return { lat, lon }
}

export async function generateRoute(
  start: { lat: number; lon: number },
  distanceMeters: number,
): Promise<RouteResult> {
  const response = await fetch('/api/routes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startLat: start.lat,
      startLon: start.lon,
      distanceMeters,
    }),
  })

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.detail ?? `Request failed (${response.status})`)
  }

  return response.json()
}
