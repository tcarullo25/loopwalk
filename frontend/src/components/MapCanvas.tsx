import { useEffect, useRef, useState, type ReactNode } from 'react'
import mapboxgl from 'mapbox-gl'
// Without this stylesheet the GL canvas gets no size and the map renders
// as an empty box — the single most common "the map didn't load".
import 'mapbox-gl/dist/mapbox-gl.css'
import type { LoopFeature } from '../lib/api'

const ROUTE_SOURCE = 'loop-route'
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

type MapCanvasProps = {
  /** The snapped loop to draw, or null before anything has been generated. */
  route?: LoopFeature | null
  /** Where to centre when there's no route yet. */
  start?: { lat: number; lon: number } | null
  /** Floating UI that sits on top of the map. */
  children?: ReactNode
}

/** Full-bleed container hosting the Mapbox GL instance. */
export default function MapCanvas({ route, start, children }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(
    TOKEN ? null : 'Missing VITE_MAPBOX_TOKEN — add it to frontend/.env.local and restart Vite.',
  )

  // --- create the map exactly once ----------------------------------------
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-74.006, 40.7128],
      zoom: 13,
      attributionControl: true,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => setReady(true))
    map.on('error', (event) => setError(event.error?.message ?? 'Mapbox failed to load.'))

    // React 18 StrictMode mounts effects twice in dev. Tearing the map down
    // here is what keeps the second mount from attaching to a dead canvas —
    // the reason the map would render once and then come up blank on reload.
    return () => {
      setReady(false)
      map.remove()
      mapRef.current = null
      startMarkerRef.current = null
    }
  }, [])

  // --- keep the container sized -------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => mapRef.current?.resize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // --- draw / update the route --------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    const existing = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined

    if (!route) {
      existing?.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    if (existing) {
      existing.setData(route)
    } else {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: route })
      map.addLayer({
        id: `${ROUTE_SOURCE}-casing`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: `${ROUTE_SOURCE}-line`,
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3c7f5d', 'line-width': 5 },
      })
    }

    const coordinates = route.geometry.coordinates
    if (coordinates.length > 0) {
      const bounds = coordinates.reduce(
        (acc, coordinate) => acc.extend(coordinate),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      )
      map.fitBounds(bounds, { padding: { top: 80, right: 80, bottom: 220, left: 80 }, duration: 800 })
    }
  }, [route, ready])

  // --- "you are here" pin --------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    if (!start) {
      startMarkerRef.current?.remove()
      startMarkerRef.current = null
      return
    }

    const lngLat: [number, number] = [start.lon, start.lat]
    if (startMarkerRef.current) {
      startMarkerRef.current.setLngLat(lngLat)
    } else {
      startMarkerRef.current = new mapboxgl.Marker({ color: '#f97f52' }).setLngLat(lngLat).addTo(map)
    }
    if (!route) map.easeTo({ center: lngLat, zoom: 14 })
  }, [start, route, ready])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-cream-200">
      <div ref={containerRef} className="absolute inset-0" />

      {error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sage-50 p-6">
          <p className="max-w-sm text-center text-sm font-semibold text-sage-700">{error}</p>
        </div>
      )}

      {/* Soft scrim so the floating panel always has contrast under it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cream-100/70 to-transparent lg:hidden"
      />

      {children}
    </div>
  )
}
