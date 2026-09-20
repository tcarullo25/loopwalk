import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, type ReactNode } from 'react'
import { MAPBOX_TOKEN, hasMapboxToken } from '../lib/mapbox'
import type { Place, RouteFeature } from '../lib/types'

const ROUTE_SOURCE = 'loop-route'
const EMPTY_ROUTE: RouteFeature = {
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: [] },
  properties: {},
}

type MapCanvasProps = {
  start: Place | null
  route: RouteFeature | null
  children?: ReactNode
}

export default function MapCanvas({ start, route, children }: MapCanvasProps) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  // --- create the map once -------------------------------------------------
  useEffect(() => {
    if (!container.current || map.current || !hasMapboxToken) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const instance = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128],
      zoom: 13,
      attributionControl: false,
    })

    instance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    instance.on('load', () => {
      instance.addSource(ROUTE_SOURCE, { type: 'geojson', data: EMPTY_ROUTE })

      // A soft halo under the path so it reads over any street colour.
      instance.addLayer({
        id: 'loop-route-halo',
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.9 },
      })
      instance.addLayer({
        id: 'loop-route-line',
        type: 'line',
        source: ROUTE_SOURCE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#4e9e75', 'line-width': 6 },
      })
    })

    map.current = instance
    return () => {
      instance.remove()
      map.current = null
    }
  }, [])

  // --- follow the start point ---------------------------------------------
  useEffect(() => {
    const instance = map.current
    if (!instance || !start) return

    marker.current?.remove()
    marker.current = new mapboxgl.Marker({ color: '#f97f52' })
      .setLngLat([start.lon, start.lat])
      .addTo(instance)

    // Only recentre when there's no route yet; fitting the loop wins otherwise.
    instance.easeTo({ center: [start.lon, start.lat], zoom: 14, duration: 800 })
  }, [start])

  // --- draw the route ------------------------------------------------------
  useEffect(() => {
    const instance = map.current
    if (!instance) return

    const draw = () => {
      const source = instance.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined
      if (!source) return

      source.setData(route ?? EMPTY_ROUTE)
      if (!route || route.geometry.coordinates.length === 0) return

      const bounds = route.geometry.coordinates.reduce(
        (acc, position) => acc.extend(position),
        new mapboxgl.LngLatBounds(
          route.geometry.coordinates[0],
          route.geometry.coordinates[0],
        ),
      )

      // Leave room for the panel: a bottom sheet on mobile, a left rail on desktop.
      const wide = window.innerWidth >= 1024
      instance.fitBounds(bounds, {
        padding: {
          top: 80,
          right: 60,
          bottom: wide ? 80 : 420,
          left: wide ? 480 : 60,
        },
        duration: 1000,
      })
    }

    if (instance.isStyleLoaded()) draw()
    else instance.once('load', draw)
  }, [route])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-cream-200">
      <div ref={container} className="absolute inset-0" />

      {!hasMapboxToken && <MissingTokenNotice />}

      {/* Soft scrim so the floating panel always has contrast under it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cream-100/80 to-transparent lg:hidden"
      />

      {children}
    </div>
  )
}

function MissingTokenNotice() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-sage-50 p-6 pb-[26rem] lg:pb-6 lg:pl-[26rem]">
      <div className="max-w-sm rounded-3xl bg-white/80 p-6 text-center shadow-soft">
        <p className="font-extrabold text-ink-800">The map needs a token</p>
        <p className="mt-2 text-sm font-semibold text-ink-500">
          Add a public Mapbox token to{' '}
          <code className="rounded-lg bg-cream-200 px-1.5 py-0.5 text-xs">
            frontend/.env.local
          </code>{' '}
          as <code className="text-xs">VITE_MAPBOX_TOKEN</code>, then restart the
          dev server.
        </p>
      </div>
    </div>
  )
}
