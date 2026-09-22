# LoopWalk

Generates circular ("loop") walking routes: given a start point and a target distance, return a
road-snapped closed loop that begins and ends at the start.

## Layout

```
loopwalk/
├─ backend/
│  ├─ LoopWalk.slnx
│  ├─ src/LoopWalk.Api/     ASP.NET Core Web API (.NET 10) — controllers + DI wiring only
│  ├─ src/LoopWalk.Core/    Geometry, routing orchestration, Mapbox client, DTOs
│  └─ tests/LoopWalk.Tests/ xUnit
└─ frontend/                React 19 + TypeScript + Vite
```

Dependency direction is one-way: `Api → Core`. `Core` never references `Api`.

## Architectural rules

- **Controllers are thin.** Validate the DTO, call one service, map the result. No math, no HTTP
  calls, no branching business logic in a controller.
- **Services are interface-backed** (`IRouteGeometryService`, `IMapboxDirectionsClient`,
  `ILoopRouteGenerator`) and registered in `Program.cs`.
- **Geometry is pure.** `RouteGeometryService` does spherical trigonometry only — no I/O, no
  randomness injected at call sites it doesn't control. This keeps it exhaustively unit-testable.
- **No over-engineering.** No generic repositories, no CQRS, no MediatR, no AutoMapper.
- Outbound HTTP goes through `IHttpClientFactory`, never `new HttpClient()`.

## How route generation works

1. Seed radius `r = D / 2π` for target distance `D`, plus a random bearing `θ`.
2. Project a circle center `r` metres from the start along `θ` (Haversine destination formula).
3. Place N waypoints evenly around that center (`θ+120°`, `θ+240°`, …).
4. Send `[start, ...waypoints, start]` to the Mapbox Directions API (`mapbox/walking`).
5. **Iterative correction:** road-snapped routes run longer than the ideal circle (typically
   15–35%). Compare `route.distance` to `D`; if the error exceeds tolerance, rescale `r` by
   `D / actual` with a damping factor (~0.7 — the raw ratio oscillates on dense street grids) and
   retry. Max 3 attempts; return the closest attempt, and report the residual error honestly
   rather than hiding it.

Steps 1–3 live in `RouteGeometryService`. Step 4 lives in `MapboxDirectionsClient`. Step 5 — the
loop that ties them together — lives in `LoopRouteGenerator`.

## API contract

`POST /api/routes/generate`

```jsonc
// request
{
  "startLat": 40.7128,
  "startLon": -74.0060,
  "distanceMeters": 5000,     // 500 – 42000
  "waypointCount": 3,         // optional, 2–8, default 3
  "seed": 12345               // optional int; same seed + same input = same route
}
```

```jsonc
// 200 response
{
  "geoJson": { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [[lon,lat], ...] }, "properties": {} },
  "requestedDistanceMeters": 5000,
  "actualDistanceMeters": 5240.8,
  "distanceErrorPercent": 4.8,
  "estimatedDurationSeconds": 3771,
  "attemptCount": 2,
  "waypoints": [{ "lat": 40.7, "lon": -74.0 }, ...]
}
```

Coordinate order is **GeoJSON `[lon, lat]`** inside `geoJson`, and named `lat`/`lon` fields
everywhere else. Do not mix the two up — it is the most common bug in this codebase's domain.

Errors: `400` with a ProblemDetails body for validation failures; `502` when Mapbox is
unreachable or returns no route (common for start points far from any walkable road).

## Frontend notes

- Map rendering is `mapbox-gl` (Mapbox GL JS). Draw the returned `geoJson` as a line layer.
- The frontend needs a **public Mapbox token** in `frontend/.env.local` as `VITE_MAPBOX_TOKEN`,
  ideally URL-restricted in the Mapbox dashboard.
- Backend dev server: `http://localhost:5266` (https on `7271`). Configure a Vite proxy for
  `/api` rather than hardcoding the origin.
- Show the user the **actual** snapped distance, not the requested one.

## Secrets

The Mapbox free tier only issues one token — the default **public** (`pk.`) one — so this project
uses that same token on both sides rather than a dedicated secret token:

```bash
dotnet user-secrets set "Mapbox:AccessToken" "<your pk. token>" --project backend/src/LoopWalk.Api
```

This is safe: a public token's scopes are already meant to be exposed in browser code, so using it
server-side too grants the backend nothing sensitive. What it costs you is independent rotation —
you can't revoke the backend's access without also breaking the map in the browser. If the Mapbox
account ever moves off the free tier, switch the backend to a real secret token and keep it out of
the frontend's `.env.local` entirely.

Either way, the token never goes in `appsettings.json` — user-secrets locally, and a real secret
store (not source control) in any deployed environment.

If the shared public token is URL-restricted in the Mapbox dashboard, that restriction checks the
browser's `Referer` header. Server-to-server calls from `MapboxDirectionsClient` don't send one, so
they're unaffected by a restriction scoped to the frontend's origins.

## Commands

```bash
dotnet build backend/LoopWalk.slnx
dotnet test backend/LoopWalk.slnx
dotnet run --project backend/src/LoopWalk.Api
npm --prefix frontend run dev
```

## Scope

MVP is: generate a loop, render it, show summary metrics. Not yet: auth, saved routes, EF Core /
PostgreSQL, turn-by-turn navigation, social features, mobile shell.
