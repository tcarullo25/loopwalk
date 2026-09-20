import { Minus, Plus } from 'lucide-react'
import { formatDuration, estimateMinutes } from '../lib/format'

type DistanceSliderProps = {
  miles: number
  onChange: (miles: number) => void
  min?: number
  max?: number
  step?: number
}

export default function DistanceSlider({
  miles,
  onChange,
  min = 1,
  max = 10,
  step = 0.5,
}: DistanceSliderProps) {
  const clamp = (value: number) =>
    Math.min(max, Math.max(min, Math.round(value / step) * step))

  const fillPercent = ((miles - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-ink-600">How far?</span>
        <span className="text-sm font-semibold text-ink-400">
          about {formatDuration(estimateMinutes(miles))}
        </span>
      </div>

      <div className="rounded-3xl bg-cream-100 p-4">
        <div className="flex items-center gap-3">
          <StepButton
            label="Shorter"
            onClick={() => onChange(clamp(miles - step))}
            disabled={miles <= min}
          >
            <Minus className="size-5" strokeWidth={3} aria-hidden />
          </StepButton>

          <div className="flex-1 text-center">
            <output
              htmlFor="distance"
              className="text-4xl font-extrabold tracking-tight text-sage-600 tabular-nums"
            >
              {miles.toFixed(1)}
            </output>
            <span className="ml-1.5 text-base font-bold text-ink-400">
              {miles === 1 ? 'mile' : 'miles'}
            </span>
          </div>

          <StepButton
            label="Longer"
            onClick={() => onChange(clamp(miles + step))}
            disabled={miles >= max}
          >
            <Plus className="size-5" strokeWidth={3} aria-hidden />
          </StepButton>
        </div>

        <input
          id="distance"
          type="range"
          min={min}
          max={max}
          step={step}
          value={miles}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Walk distance in miles"
          aria-valuetext={`${miles.toFixed(1)} miles`}
          className="lw-slider mt-1"
          style={{ '--lw-fill': `${fillPercent}%` } as React.CSSProperties}
        />

        <div className="flex justify-between px-1 text-xs font-bold text-ink-400">
          <span>{min} mi</span>
          <span>{max} mi</span>
        </div>
      </div>
    </div>
  )
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-sage-600 shadow-soft transition-all duration-200 hover:bg-sage-50 active:scale-90 disabled:opacity-40 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-500"
    >
      {children}
    </button>
  )
}
