import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DEFAULT_START, type RouteResult } from '../lib/route'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

const ROUTE_SOURCE_ID = 'loop-route'
const ROUTE_LAYER_ID = 'loop-route-line'
const DEFAULT_CENTER: [number, number] = [DEFAULT_START.lon, DEFAULT_START.lat]
const START_MARKER_COLOR = '#f97f52' // --color-peach-500

type StartPoint = { lat: number; lon: number }

type MapCanvasProps = {
  /** Floating UI that sits on top of the map. */
  children?: ReactNode
  route?: RouteResult | null
  /** The resolved start location — shown as a "you are here" pin. */
  startPoint?: StartPoint | null
}

/** Full-bleed container hosting the Mapbox GL instance. Draws the returned loop when present. */
export default function MapCanvas({ children, route, startPoint }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: DEFAULT_CENTER,
      zoom: 14,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !route) return

    const applyRoute = () => {
      const existingSource = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined

      if (existingSource) {
        existingSource.setData(route.geoJson)
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: route.geoJson })
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3c7f5d', 'line-width': 5 },
        })
      }

      const coordinates = route.geoJson.geometry.coordinates
      const bounds = coordinates.reduce(
        (acc, coord) => acc.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      )
      map.fitBounds(bounds, { padding: 64, duration: 500 })
    }

    if (map.isStyleLoaded()) applyRoute()
    else map.once('load', applyRoute)
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!startPoint) {
      startMarkerRef.current?.remove()
      startMarkerRef.current = null
      return
    }

    const lngLat: [number, number] = [startPoint.lon, startPoint.lat]

    if (startMarkerRef.current) {
      startMarkerRef.current.setLngLat(lngLat)
    } else {
      startMarkerRef.current = new mapboxgl.Marker({ color: START_MARKER_COLOR })
        .setLngLat(lngLat)
        .addTo(map)
    }

    // Once a route is drawn, fitBounds already frames the whole loop — don't fight it.
    if (!route) {
      map.flyTo({ center: lngLat, zoom: 15, duration: 800 })
    }
  }, [startPoint, route])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-cream-200">
      {/*
        Inline position: mapbox-gl.css ships its own `.mapboxgl-map { position: relative }`
        rule, which otherwise wins the cascade over the `absolute` utility class here and
        collapses this container (and the map) to zero height.
      */}
      <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute' }} />

      {/* Soft scrim so the floating panel always has contrast under it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-cream-100/70 to-transparent lg:hidden"
      />

      {children}
    </div>
  )
}
