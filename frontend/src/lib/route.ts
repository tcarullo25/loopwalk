export type LineStringFeature = {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: Record<string, unknown>
}

export type Waypoint = { lat: number; lon: number }

/** Washington Square Park, NYC — the map's default view and the geocoder's fallback bias. */
export const DEFAULT_START: Waypoint = { lat: 40.7308, lon: -73.9973 }

export type GeocodeSuggestion = {
  id: string
  placeName: string
  lat: number
  lon: number
}

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

type MapboxGeocodeFeature = {
  id: string
  place_name: string
  center: [number, number]
}

/**
 * Forward geocoding via Mapbox — resolves free-text addresses to coordinates.
 * `proximity` biases results toward a location (the map's current center by default);
 * without it Mapbox ranks purely on text relevance, which can return a same-named place
 * on the other side of the world.
 */
export async function geocodeAddress(
  query: string,
  limit = 5,
  proximity: Waypoint = DEFAULT_START,
): Promise<GeocodeSuggestion[]> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  const trimmed = query.trim()
  if (!token || !trimmed) return []

  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`)
  url.searchParams.set('access_token', token)
  url.searchParams.set('autocomplete', 'true')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('proximity', `${proximity.lon},${proximity.lat}`)

  const response = await fetch(url.toString())
  if (!response.ok) return []

  const data: { features?: MapboxGeocodeFeature[] } = await response.json()
  return (data.features ?? []).map((feature) => ({
    id: feature.id,
    placeName: feature.place_name,
    lat: feature.center[1],
    lon: feature.center[0],
  }))
}
