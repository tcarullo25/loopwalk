import { useEffect, useRef, useState } from 'react'
import { Crosshair, LoaderCircle, MapPin } from 'lucide-react'
import { geocodeAddress, type GeocodeSuggestion } from '../lib/route'

type LocationInputProps = {
  value: string
  onChange: (value: string) => void
  onSelectPlace: (place: GeocodeSuggestion) => void
  onUseCurrentLocation: () => void
  locating?: boolean
}

export default function LocationInput({
  value,
  onChange,
  onSelectPlace,
  onUseCurrentLocation,
  locating = false,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const skipNextLookup = useRef(false)

  // Selecting a suggestion (or the geolocation button) rewrites `value` too — don't
  // re-query Mapbox for the text we just set ourselves.
  useEffect(() => {
    if (skipNextLookup.current) {
      skipNextLookup.current = false
      return
    }

    if (value.trim().length < 3) return

    const handle = setTimeout(async () => {
      const results = await geocodeAddress(value)
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 300)

    return () => clearTimeout(handle)
  }, [value])

  const handleSelect = (suggestion: GeocodeSuggestion) => {
    skipNextLookup.current = true
    onChange(suggestion.placeName)
    onSelectPlace(suggestion)
    setSuggestions([])
    setOpen(false)
  }

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
            onChange={(event) => {
              const next = event.target.value
              onChange(next)
              if (next.trim().length < 3) {
                setSuggestions([])
                setOpen(false)
              }
            }}
            onFocus={() => setOpen(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Your front door, a park, anywhere…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full rounded-2xl border-2 border-cream-200 bg-cream-50 py-3.5 pr-4 pl-12 text-base font-semibold text-ink-800 placeholder:font-normal placeholder:text-ink-400 transition-colors duration-200 focus:border-sage-300 focus:bg-white focus:outline-none"
          />

          {open && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-auto rounded-2xl border border-cream-200 bg-white py-1.5 shadow-lift">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(suggestion)}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-ink-800 transition-colors duration-150 hover:bg-sage-50"
                  >
                    {suggestion.placeName}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
