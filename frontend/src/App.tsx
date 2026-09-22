import { useState } from 'react'
import FloatingPanel from './components/FloatingPanel'
import MapCanvas from './components/MapCanvas'
import WalkPlannerCard from './components/WalkPlannerCard'
import { generateRoute, geocodeAddress, parseLatLon, type GeocodeSuggestion, type RouteResult } from './lib/route'
import { metresToMiles, milesToMetres } from './lib/format'

type Coords = { lat: number; lon: number }

export default function App() {
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locating, setLocating] = useState(false)
  const [miles, setMiles] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)

  const handleLocationChange = (value: string) => {
    setLocation(value)
    // Typing invalidates whatever we'd previously resolved — re-snap on the next generate.
    setCoords(null)
  }

  const handleSelectPlace = (place: GeocodeSuggestion) => {
    setLocation(place.placeName)
    setCoords({ lat: place.lat, lon: place.lon })
  }

  const handleUseCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        setCoords({ lat: latitude, lon: longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  /** Resolves the typed text to coordinates: already-picked coords, "lat, lon", or a geocode lookup. */
  const resolveStart = async (): Promise<Coords | null> => {
    if (coords) return coords

    const manual = parseLatLon(location)
    if (manual) return manual

    const [best] = await geocodeAddress(location, 1)
    if (!best) return null

    setLocation(best.placeName)
    setCoords({ lat: best.lat, lon: best.lon })
    return { lat: best.lat, lon: best.lon }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const start = await resolveStart()
      if (!start) {
        setError("Couldn't find that location — try a more specific address.")
        return
      }

      setRoute(await generateRoute(start, milesToMetres(miles)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <MapCanvas route={route} startPoint={coords}>
      <FloatingPanel>
        <WalkPlannerCard
          location={location}
          onLocationChange={handleLocationChange}
          onSelectPlace={handleSelectPlace}
          onUseCurrentLocation={handleUseCurrentLocation}
          locating={locating}
          miles={miles}
          onMilesChange={setMiles}
          onGenerate={handleGenerate}
          generating={generating}
        />

        {error && <p className="mt-3 text-sm font-semibold text-peach-500">{error}</p>}

        {route && !error && (
          <p className="mt-3 text-sm font-semibold text-sage-600">
            Snapped to {metresToMiles(route.actualDistanceMeters).toFixed(1)} mi (
            {route.distanceErrorPercent >= 0 ? '+' : ''}
            {route.distanceErrorPercent.toFixed(1)}% vs. requested) · {Math.round(route.estimatedDurationSeconds / 60)} min
          </p>
        )}
      </FloatingPanel>
    </MapCanvas>
  )
}
