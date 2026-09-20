import { Route, TriangleAlert } from 'lucide-react'
import AppHeader from './AppHeader'
import DistanceSlider from './DistanceSlider'
import LocationInput from './LocationInput'
import PrimaryButton from './PrimaryButton'

type WalkPlannerCardProps = {
  location: string
  onLocationChange: (value: string) => void
  onUseCurrentLocation: () => void
  locating?: boolean
  miles: number
  onMilesChange: (miles: number) => void
  onGenerate: () => void
  generating?: boolean
  error?: string | null
}

export default function WalkPlannerCard({
  location,
  onLocationChange,
  onUseCurrentLocation,
  locating,
  miles,
  onMilesChange,
  onGenerate,
  generating = false,
  error = null,
}: WalkPlannerCardProps) {
  const canGenerate = location.trim().length > 0 && !generating

  return (
    <div className="space-y-5">
      <AppHeader />

      <LocationInput
        value={location}
        onChange={onLocationChange}
        onUseCurrentLocation={onUseCurrentLocation}
        locating={locating}
      />

      <DistanceSlider miles={miles} onChange={onMilesChange} />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl bg-peach-100 px-4 py-3 text-sm font-semibold text-ink-600"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-peach-500"
            strokeWidth={2.5}
            aria-hidden
          />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <PrimaryButton
          onClick={onGenerate}
          disabled={!canGenerate}
          icon={
            <Route
              className="size-5 transition-transform duration-300 group-hover:-translate-x-0.5"
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
