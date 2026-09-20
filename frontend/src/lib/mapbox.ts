/**
 * The frontend's own PUBLIC, URL-restricted Mapbox token. The backend's secret
 * token must never reach the browser — these are two different tokens.
 */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? ''

export const hasMapboxToken = MAPBOX_TOKEN.length > 0
