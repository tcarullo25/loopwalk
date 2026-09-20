/** Shapes returned by `POST /api/routes/generate`. Coordinates inside
 *  `geoJson` are GeoJSON order — `[lon, lat]`. Everywhere else it's named
 *  `lat`/`lon` fields. Don't mix the two up. */

export type LoopFeature = {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: Record<string, unknown>
}

export type RouteResponse = {
  geoJson: LoopFeature
  requestedDistanceMeters: number
  actualDistanceMeters: number
  distanceErrorPercent: number
  estimatedDurationSeconds: number
  attemptCount: number
  waypoints: { lat: number; lon: number }[]
}

export type RouteRequest = {
  startLat: number
  startLon: number
  distanceMeters: number
  waypointCount?: number
  seed?: number
}

export async function generateRoute(
  request: RouteRequest,
  signal?: AbortSignal,
): Promise<RouteResponse> {
  const response = await fetch('/api/routes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok) {
    // The API reports failures as ProblemDetails; fall back to the status text.
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.detail ?? problem?.title ?? `Route request failed (${response.status})`)
  }

  return response.json()
}
