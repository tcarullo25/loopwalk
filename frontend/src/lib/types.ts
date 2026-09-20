/** GeoJSON positions are [lon, lat] — the reverse of how we name them everywhere else. */
export type Position = [number, number]

export type RouteFeature = {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: Position[] }
  properties: Record<string, unknown>
}

export type Waypoint = { lat: number; lon: number }

export type GenerateRouteResponse = {
  geoJson: RouteFeature
  requestedDistanceMeters: number
  actualDistanceMeters: number
  distanceErrorPercent: number
  estimatedDurationSeconds: number
  attemptCount: number
  waypoints: Waypoint[]
}

/** A resolved starting point: named coordinates plus the label we show the user. */
export type Place = {
  lat: number
  lon: number
  label: string
}
