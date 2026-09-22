import { useState } from 'react'
import FloatingPanel from './components/FloatingPanel'
import MapCanvas from './components/MapCanvas'
import WalkPlannerCard from './components/WalkPlannerCard'
import { generateRoute, parseLatLon, type RouteResult } from './lib/route'
import { metresToMiles, milesToMetres } from './lib/format'

export default function App() {
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [miles, setMiles] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)

  const handleUseCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const handleGenerate = async () => {
    const start = parseLatLon(location)
    if (!start) {
      setError('Enter a location as "lat, lon", or use the crosshair button.')
      return
    }

    setGenerating(true)
    setError(null)
    try {
      setRoute(await generateRoute(start, milesToMetres(miles)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <MapCanvas route={route}>
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
