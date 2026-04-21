import type { OrsProfile } from '../types'

const BASE = 'https://api.openrouteservice.org/v2'
const KEY = import.meta.env.VITE_ORS_API_KEY as string

// ORS hata kodları: yol ağından uzak nokta
const ORS_ERR_POINT_NOT_NEAR_ROAD = 2010
const ORS_ERR_ROUTE_NOT_FOUND = 2009

export async function fetchIsochrones(
  profile: OrsProfile,
  origin: [number, number],
  selectedTimes: number[],
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const rangeSeconds = selectedTimes.map((t) => t * 60)

  const res = await fetch(`${BASE}/isochrones/${profile}`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': KEY,
    },
    body: JSON.stringify({
      locations: [origin],
      range: rangeSeconds,
      range_type: 'time',
      attributes: ['area'],
    }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null) as { error?: { code?: number; message?: string } } | null
    const code = json?.error?.code
    if (code === ORS_ERR_POINT_NOT_NEAR_ROAD || code === ORS_ERR_ROUTE_NOT_FOUND) {
      throw new Error('Seçilen noktanın yakınında yol bulunamadı. Lütfen bir yola yakın noktaya tıklayın.')
    }
    throw new Error(json?.error?.message ?? `İzocron hesaplanamadı (${res.status})`)
  }

  return res.json() as Promise<GeoJSON.FeatureCollection>
}

export async function fetchRoute(
  profile: OrsProfile,
  origin: [number, number],
  destination: [number, number],
  signal?: AbortSignal,
): Promise<GeoJSON.Feature> {
  const res = await fetch(`${BASE}/directions/${profile}/geojson`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': KEY,
    },
    body: JSON.stringify({
      coordinates: [origin, destination],
    }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null) as { error?: { code?: number; message?: string } } | null
    const code = json?.error?.code
    if (code === ORS_ERR_POINT_NOT_NEAR_ROAD || code === ORS_ERR_ROUTE_NOT_FOUND) {
      throw new Error('Seçilen noktanın yakınında yol bulunamadı. Lütfen bir yola yakın noktaya tıklayın.')
    }
    throw new Error(json?.error?.message ?? `Rota hesaplanamadı (${res.status})`)
  }

  const fc = await res.json() as GeoJSON.FeatureCollection
  const feature = fc.features?.[0]
  if (!feature) throw new Error('Rota verisi alınamadı.')
  return feature
}
