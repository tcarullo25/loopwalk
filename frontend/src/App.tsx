import { useState } from 'react'
import FloatingPanel from './components/FloatingPanel'
import MapCanvas from './components/MapCanvas'
import WalkPlannerCard from './components/WalkPlannerCard'

export default function App() {
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [miles, setMiles] = useState(3)

  // Placeholder wiring — the real geolocation + API calls come next.
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

  const handleGenerate = () => {
    console.log('generate', { location, miles })
  }

  return (
    <MapCanvas>
      <FloatingPanel>
        <WalkPlannerCard
          location={location}
          onLocationChange={setLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
          locating={locating}
          miles={miles}
          onMilesChange={setMiles}
          onGenerate={handleGenerate}
        />
      </FloatingPanel>
    </MapCanvas>
  )
}
