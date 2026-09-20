import type { GenerateRouteResponse } from './types'

export type GenerateRouteRequest = {
  startLat: number
  startLon: number
  distanceMeters: number
  waypointCount?: number
  seed?: number
}

/** ASP.NET Core ProblemDetails. */
type ProblemDetails = { title?: string; detail?: string }

export class ApiError extends Error {}

export async function generateRoute(
  request: GenerateRouteRequest,
  signal?: AbortSignal,
): Promise<GenerateRouteResponse> {
  let response: Response
  try {
    response = await fetch('/api/routes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch {
    throw new ApiError("Couldn't reach LoopWalk. Is the backend running?")
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetails | null
    throw new ApiError(
      problem?.detail ??
        problem?.title ??
        (response.status === 502
          ? "We couldn't find a walkable loop around there. Try a different spot."
          : 'Something went wrong generating your loop.'),
    )
  }

  return (await response.json()) as GenerateRouteResponse
}
