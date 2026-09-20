import { useCallback, useState } from 'react'
import FloatingPanel from './components/FloatingPanel'
import MapCanvas from './components/MapCanvas'
import RouteReadyCard from './components/RouteReadyCard'
import WalkPlannerCard from './components/WalkPlannerCard'
import { ApiError, generateRoute } from './lib/api'
import { forwardGeocode, GeocodeError, reverseGeocode } from './lib/geocode'
import { milesToMetres } from './lib/format'
import type { GenerateRouteResponse, Place } from './lib/types'

export default function App() {
  const [locationText, setLocationText] = useState('')
  const [place, setPlace] = useState<Place | null>(null)
  const [locating, setLocating] = useState(false)

  const [miles, setMiles] = useState(3)
  const [route, setRoute] = useState<GenerateRouteResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Typing invalidates the resolved place — the text is the source of truth
  // until it's geocoded again.
  const handleLocationChange = (value: string) => {
    setLocationText(value)
    setPlace(null)
    setError(null)
  }

  const handleUseCurrentLocation = () => {
    setLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const resolved = await reverseGeocode(coords.latitude, coords.longitude)
          setPlace(resolved)
          setLocationText(resolved.label)
        } catch {
          // Geocoding is a nicety; the coordinates are what actually matter.
          const fallback: Place = {
            lat: coords.latitude,
            lon: coords.longitude,
            label: 'My current location',
          }
          setPlace(fallback)
          setLocationText(fallback.label)
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setError("We couldn't get your location. Try typing an address instead.")
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  /** Resolve the text to coordinates if we don't already have them. */
  const resolvePlace = useCallback(async (): Promise<Place> => {
    if (place && place.label === locationText) return place
    const resolved = await forwardGeocode(locationText)
    setPlace(resolved)
    setLocationText(resolved.label)
    return resolved
  }, [place, locationText])

  const run = useCallback(
    async (seed?: number) => {
      setBusy(true)
      setError(null)
      try {
        const start = await resolvePlace()
        const result = await generateRoute({
          startLat: start.lat,
          startLon: start.lon,
          distanceMeters: Math.round(milesToMetres(miles)),
          seed,
        })
        setRoute(result)
      } catch (caught) {
        setRoute(null)
        setError(
          caught instanceof ApiError || caught instanceof GeocodeError
            ? caught.message
            : 'Something went wrong. Give it another try?',
        )
      } finally {
        setBusy(false)
      }
    },
    [miles, resolvePlace],
  )

  const handleStartOver = () => {
    setRoute(null)
    setError(null)
  }

  return (
    <MapCanvas start={place} route={route?.geoJson ?? null}>
      <FloatingPanel>
        {route && place ? (
          <RouteReadyCard
            route={route}
            start={place}
            shuffling={busy}
            onShuffle={() => run(Math.floor(Math.random() * 1_000_000))}
            onStartOver={handleStartOver}
          />
        ) : (
          <WalkPlannerCard
            location={locationText}
            onLocationChange={handleLocationChange}
            onUseCurrentLocation={handleUseCurrentLocation}
            locating={locating}
            miles={miles}
            onMilesChange={setMiles}
            onGenerate={() => run()}
            generating={busy}
            error={error}
          />
        )}
      </FloatingPanel>
    </MapCanvas>
  )
}
