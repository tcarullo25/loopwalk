import { Navigation } from 'lucide-react'
import AppHeader from './AppHeader'
import DistanceSlider from './DistanceSlider'
import LocationInput from './LocationInput'
import PrimaryButton from './PrimaryButton'
import type { GeocodeSuggestion } from '../lib/route'

type WalkPlannerCardProps = {
  location: string
  onLocationChange: (value: string) => void
  onSelectPlace: (place: GeocodeSuggestion) => void
  onUseCurrentLocation: () => void
  locating?: boolean
  miles: number
  onMilesChange: (miles: number) => void
  onGenerate: () => void
  generating?: boolean
}

export default function WalkPlannerCard({
  location,
  onLocationChange,
  onSelectPlace,
  onUseCurrentLocation,
  locating,
  miles,
  onMilesChange,
  onGenerate,
  generating = false,
}: WalkPlannerCardProps) {
  const canGenerate = location.trim().length > 0 && !generating

  return (
    <div className="space-y-5">
      <AppHeader />

      <LocationInput
        value={location}
        onChange={onLocationChange}
        onSelectPlace={onSelectPlace}
        onUseCurrentLocation={onUseCurrentLocation}
        locating={locating}
      />

      <DistanceSlider miles={miles} onChange={onMilesChange} />

      <div className="space-y-2.5">
        <PrimaryButton
          onClick={onGenerate}
          disabled={!canGenerate}
          icon={
            <Navigation
              className="size-5 transition-transform duration-300 group-hover:rotate-12"
              strokeWidth={2.5}
              aria-hidden
            />
          }
        >
          {generating ? 'Finding your loop…' : "Let's Walk!"}
        </PrimaryButton>

        <p className="text-center text-xs font-semibold text-ink-400">
          We'll draw you a loop that ends right where it started.
        </p>
      </div>
    </div>
  )
}
