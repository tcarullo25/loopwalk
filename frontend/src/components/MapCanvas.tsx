import type { ReactNode } from 'react'

type MapCanvasProps = {
  /** Floating UI that sits on top of the map. */
  children?: ReactNode
}

/**
 * Full-bleed container that will host the Mapbox GL instance.
 *
 * Right now it renders a placeholder so the layout and panel can be designed
 * against something map-shaped. The real `mapbox-gl` map mounts into the
 * inner div once we wire it up.
 */
export default function MapCanvas({ children }: MapCanvasProps) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-cream-200">
      {/* --- placeholder "map" ------------------------------------------- */}
      <div
        aria-hidden
        className="absolute inset-0 bg-sage-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(60 127 93 / 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(60 127 93 / 0.07) 1px, transparent 1px),
            radial-gradient(circle at 25% 30%, rgb(147 207 174 / 0.35), transparent 45%),
            radial-gradient(circle at 78% 68%, rgb(168 216 240 / 0.35), transparent 40%)
          `,
          backgroundSize: '48px 48px, 48px 48px, 100% 100%, 100% 100%',
        }}
      />
      <p className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold tracking-wide text-sage-600/50 select-none">
        map goes here
      </p>

      {/* Soft scrim so the floating panel always has contrast under it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cream-100/70 to-transparent lg:hidden"
      />

      {children}
    </div>
  )
}
