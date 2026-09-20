import { Clock, MapPin, RotateCw, Ruler, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDuration, metresToMiles } from '../lib/format'
import type { GenerateRouteResponse, Place } from '../lib/types'

type RouteReadyCardProps = {
  route: GenerateRouteResponse
  start: Place
  onShuffle: () => void
  onStartOver: () => void
  shuffling?: boolean
}

export default function RouteReadyCard({
  route,
  start,
  onShuffle,
  onStartOver,
  shuffling = false,
}: RouteReadyCardProps) {
  const miles = metresToMiles(route.actualDistanceMeters)
  const minutes = Math.round(route.estimatedDurationSeconds / 60)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-sage-500">Your loop is ready</p>
          <h2 className="text-xl leading-tight font-extrabold tracking-tight text-ink-800">
            Off you go!
          </h2>
        </div>
        <button
          type="button"
          onClick={onStartOver}
          aria-label="Start over"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-cream-200 text-ink-500 transition-colors duration-200 hover:bg-cream-100 hover:text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-400"
        >
          <X className="size-4" strokeWidth={3} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={<Ruler className="size-4" strokeWidth={2.5} aria-hidden />}
          label="Distance"
          value={miles.toFixed(1)}
          unit={miles === 1 ? 'mile' : 'miles'}
          tone="sage"
        />
        <Stat
          icon={<Clock className="size-4" strokeWidth={2.5} aria-hidden />}
          label="Walking time"
          value={formatDuration(minutes)}
          tone="peach"
        />
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-cream-100 px-4 py-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-peach-400" strokeWidth={2.5} aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-600">{start.label}</p>
          <p className="text-xs font-semibold text-ink-400">
            Starts and ends here · {route.waypoints.length} waypoints
          </p>
        </div>
      </div>

      {/*
        The snapped route rarely lands exactly on the target. Say so plainly
        rather than quietly showing the number they asked for.
      */}
      <p className="text-center text-xs font-semibold text-ink-400">
        {describeError(route.distanceErrorPercent, metresToMiles(route.requestedDistanceMeters))}
      </p>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onShuffle}
          disabled={shuffling}
          className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-sage-500 px-5 py-3.5 font-extrabold text-white shadow-sage transition-all duration-200 hover:-translate-y-0.5 hover:bg-sage-600 hover:shadow-lift active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage-500"
        >
          <RotateCw
            className={`size-4 transition-transform duration-500 group-hover:rotate-180 ${shuffling ? 'animate-spin' : ''}`}
            strokeWidth={3}
            aria-hidden
          />
          {shuffling ? 'Shuffling…' : 'Shuffle'}
        </button>

        <button
          type="button"
          onClick={onStartOver}
          className="rounded-full bg-cream-200 px-5 py-3.5 font-extrabold text-ink-600 transition-all duration-200 hover:bg-cream-100 hover:text-ink-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-400"
        >
          Start over
        </button>
      </div>
    </div>
  )
}

function describeError(errorPercent: number, requestedMiles: number) {
  const rounded = Math.round(Math.abs(errorPercent))
  if (rounded <= 3) return `Right on target — you asked for ${requestedMiles.toFixed(1)} miles.`
  const direction = errorPercent > 0 ? 'longer' : 'shorter'
  return `About ${rounded}% ${direction} than the ${requestedMiles.toFixed(1)} miles you asked for — roads don't bend into perfect circles.`
}

function Stat({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  unit?: string
  tone: 'sage' | 'peach'
}) {
  const tones = {
    sage: 'bg-sage-100 text-sage-600',
    peach: 'bg-peach-100 text-peach-500',
  } as const

  return (
    <div className="rounded-3xl bg-cream-100 p-4">
      <div className="flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-full ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-xs font-bold text-ink-400">{label}</span>
      </div>
      <p className="mt-2 text-2xl leading-none font-extrabold tracking-tight text-ink-800 tabular-nums">
        {value}
        {unit && <span className="ml-1 text-sm font-bold text-ink-400">{unit}</span>}
      </p>
    </div>
  )
}
