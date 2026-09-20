import { Crosshair, LoaderCircle, MapPin } from 'lucide-react'

type LocationInputProps = {
  value: string
  onChange: (value: string) => void
  onUseCurrentLocation: () => void
  locating?: boolean
}

export default function LocationInput({
  value,
  onChange,
  onUseCurrentLocation,
  locating = false,
}: LocationInputProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="start-location"
        className="block text-sm font-bold text-ink-600"
      >
        Starting from
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-peach-400"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            id="start-location"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Your front door, a park, anywhere…"
            autoComplete="off"
            className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50 py-3.5 pr-4 pl-12 text-base font-semibold text-ink-800 placeholder:font-normal placeholder:text-ink-400 transition-colors duration-200 focus:border-sage-300 focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={locating}
          title="Use my current location"
          aria-label="Use my current location"
          className="grid size-[3.375rem] shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-500 transition-all duration-200 hover:bg-sky-200 hover:text-sky-500 active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          {locating ? (
            <LoaderCircle className="size-5 animate-spin" strokeWidth={2.5} aria-hidden />
          ) : (
            <Crosshair className="size-5" strokeWidth={2.5} aria-hidden />
          )}
        </button>
      </div>
    </div>
  )
}
