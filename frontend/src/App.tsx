import { useState } from 'react'
import FloatingPanel from './components/FloatingPanel'
import MapCanvas from './components/MapCanvas'
import WalkPlannerCard from './components/WalkPlannerCard'
import { generateRoute, type RouteResponse } from './lib/api'
import { formatDuration, formatMiles, metresToMiles, milesToMetres } from './lib/format'

/** Accepts "40.7128, -74.0060". Geocoding of place names comes later. */
function parseLatLon(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  const lat = Number(match[1])
  const lon = Number(match[2])
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon }
}

export default function App() {
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [miles, setMiles] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [route, setRoute] = useState<RouteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = parseLatLon(location)

  const handleUseCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        setLocating(false)
      },
      () => {
        setError("Couldn't read your location — type coordinates instead.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const handleGenerate = async () => {
    if (!start) {
      setError('Enter a start point as "latitude, longitude".')
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const result = await generateRoute({
        startLat: start.lat,
        startLon: start.lon,
        distanceMeters: Math.round(milesToMetres(miles)),
      })
      setRoute(result)
    } catch (cause) {
      setRoute(null)
      setError(cause instanceof Error ? cause.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  // Always report the snapped distance, never the one that was asked for.
  const actualMiles = route ? metresToMiles(route.actualDistanceMeters) : null

  return (
    <MapCanvas route={route?.geoJson ?? null} start={start}>
      <FloatingPanel>
        <WalkPlannerCard
          location={location}
          onLocationChange={setLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
          locating={locating}
          miles={miles}
          onMilesChange={setMiles}
          onGenerate={handleGenerate}
          generating={generating}
        />

        {error && (
          <p className="mt-4 rounded-2xl bg-peach-100 px-4 py-3 text-center text-xs font-semibold text-ink-600">
            {error}
          </p>
        )}

        {actualMiles !== null && route && (
          <p className="mt-4 rounded-2xl bg-sage-100 px-4 py-3 text-center text-xs font-semibold text-sage-700">
            {formatMiles(actualMiles)} · {formatDuration(Math.round(route.estimatedDurationSeconds / 60))}
          </p>
        )}
      </FloatingPanel>
    </MapCanvas>
  )
}
