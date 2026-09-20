import { MAPBOX_TOKEN, hasMapboxToken } from './mapbox'
import type { Place } from './types'

const GEOCODE_BASE = 'https://api.mapbox.com/search/geocode/v6'

type GeocodeFeature = {
  properties?: {
    name?: string
    place_formatted?: string
    full_address?: string
    coordinates?: { latitude: number; longitude: number }
  }
}

type GeocodeResponse = { features?: GeocodeFeature[] }

export class GeocodeError extends Error {}

/** Prefer "Prospect Park, Brooklyn" over a full postal address — friendlier, and it fits. */
function labelOf(feature: GeocodeFeature): string {
  const { name, place_formatted, full_address } = feature.properties ?? {}
  if (name && place_formatted) return `${name}, ${place_formatted}`
  return name ?? full_address ?? place_formatted ?? 'Unknown place'
}

async function request(url: string): Promise<GeocodeFeature | null> {
  if (!hasMapboxToken) throw new GeocodeError('No Mapbox token configured.')

  const response = await fetch(url).catch(() => null)
  if (!response?.ok) throw new GeocodeError("Couldn't look that place up.")

  const data = (await response.json()) as GeocodeResponse
  return data.features?.[0] ?? null
}

/** Free text -> a place. Used when someone types an address instead of tapping "locate me". */
export async function forwardGeocode(query: string): Promise<Place> {
  const url =
    `${GEOCODE_BASE}/forward?q=${encodeURIComponent(query)}` +
    `&limit=1&access_token=${MAPBOX_TOKEN}`

  const feature = await request(url)
  const coordinates = feature?.properties?.coordinates
  if (!feature || !coordinates) {
    throw new GeocodeError(`We couldn't find "${query}". Try being a bit more specific?`)
  }

  return { lat: coordinates.latitude, lon: coordinates.longitude, label: labelOf(feature) }
}

/** Coordinates -> a human label, so the field never has to show raw decimals. */
export async function reverseGeocode(lat: number, lon: number): Promise<Place> {
  const url =
    `${GEOCODE_BASE}/reverse?longitude=${lon}&latitude=${lat}` +
    `&limit=1&access_token=${MAPBOX_TOKEN}`

  const feature = await request(url)
  return { lat, lon, label: feature ? labelOf(feature) : 'My current location' }
}
