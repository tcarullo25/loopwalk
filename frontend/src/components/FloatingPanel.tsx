import type { ReactNode } from 'react'

/**
 * Positions the planner over the map: a bottom sheet on mobile, a floating
 * side panel on desktop. Soft frosted glass so the map still reads through it.
 */
export default function FloatingPanel({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-start p-3 sm:p-5 lg:inset-y-0 lg:right-auto lg:w-[26rem] lg:items-center lg:p-6">
      <div className="pointer-events-auto w-full rounded-[1.75rem] border border-white/60 bg-cream-50/85 p-5 shadow-lift backdrop-blur-xl sm:p-6">
        {children}
      </div>
    </div>
  )
}
