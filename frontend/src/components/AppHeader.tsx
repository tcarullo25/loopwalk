import { Footprints } from 'lucide-react'

export default function AppHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-600">
        <Footprints className="size-6" strokeWidth={2.5} aria-hidden />
      </div>
      <div>
        <h1 className="text-xl leading-tight font-extrabold tracking-tight text-ink-800">
          LoopWalk
        </h1>
        <p className="text-sm font-semibold text-ink-400">
          Walks that bring you home
        </p>
      </div>
    </div>
  )
}
