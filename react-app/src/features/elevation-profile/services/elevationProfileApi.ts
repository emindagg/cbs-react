import type { ElevationPoint, ElevationStats } from '../types'

const BASE = 'https://api.openrouteservice.org'
const KEY = import.meta.env.VITE_ORS_API_KEY as string

const MAX_POINTS = 950

/** Haversine mesafesi (metre) */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/**
 * Düz hat modu için: her segment boyunca her stepMeters'da bir ara nokta ekler.
 * ORS Elevation API ~1000 nokta sınırı — gerekirse decimation uygulanır.
 */
export function interpolatePoints(
  waypoints: [number, number][],
  stepMeters = 100,
): [number, number][] {
  if (waypoints.length < 2) return waypoints

  const points: [number, number][] = []

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i]
    const b = waypoints[i + 1]
    const dist = haversineMeters(a, b)
    const steps = Math.max(1, Math.ceil(dist / stepMeters))

    // s < steps: segment başını ekle, B'yi sonraki segment başına bırak
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      points.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
      ])
    }
  }
  // Son waypoint'i tek seferlik ekle
  points.push(waypoints[waypoints.length - 1])

  // API nokta sınırını aşıyorsa basit decimation
  if (points.length > MAX_POINTS) {
    const ratio = Math.ceil(points.length / MAX_POINTS)
    return points.filter((_, idx) => idx % ratio === 0)
  }

  return points
}

/**
 * Grafik cursor'unun tam distance (km) değerine karşılık gelen coğrafi konumu
 * ElevationPoint dizisinden doğrusal interpolasyonla hesaplar.
 * activePayload'ın diskrit snap davranışının yerine geçer.
 */
export function interpolateActivePoint(
  data: ElevationPoint[],
  exactDist: number,
): ElevationPoint | null {
  if (!data.length) return null
  if (exactDist <= data[0].distance) return data[0]
  if (exactDist >= data[data.length - 1].distance) return data[data.length - 1]

  // Binary search: exactDist'e eşit veya küçük son indeks
  let lo = 0
  let hi = data.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (data[mid].distance <= exactDist) lo = mid
    else hi = mid
  }

  const a = data[lo]
  const b = data[hi]
  const t = b.distance === a.distance
    ? 0
    : (exactDist - a.distance) / (b.distance - a.distance)

  return {
    distance: exactDist,
    elevation: Math.round(a.elevation + (b.elevation - a.elevation) * t),
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
  }
}

/** Koordinat dizisinden kümülatif mesafe + stats hesaplar */
export function computeElevationPoints(
  coords: [number, number, number][],
): { points: ElevationPoint[]; stats: ElevationStats } {
  let cumulativeDist = 0
  let totalAscent = 0
  let totalDescent = 0
  let minElevation = Infinity
  let maxElevation = -Infinity
  let elevSum = 0
  let maxSlope = 0

  const points: ElevationPoint[] = coords.map((coord, i) => {
    const [lng, lat, elev] = coord

    if (i > 0) {
      const prev = coords[i - 1]
      const segDist = haversineMeters([prev[0], prev[1]], [lng, lat])
      cumulativeDist += segDist
      const elevDiff = elev - prev[2]
      if (elevDiff > 0) totalAscent += elevDiff
      else totalDescent += Math.abs(elevDiff)

      // Eğim: yükseklik farkı / yatay mesafe * 100 (%)
      if (segDist > 0) {
        const slope = Math.abs(elevDiff / segDist) * 100
        if (slope > maxSlope) maxSlope = slope
      }
    }

    if (elev < minElevation) minElevation = elev
    if (elev > maxElevation) maxElevation = elev
    elevSum += elev

    return {
      distance: Math.round(cumulativeDist / 10) / 100, // km, 2 ondalık
      elevation: Math.round(elev),
      lng,
      lat,
    }
  })

  const totalDistM = cumulativeDist
  // Ortalama eğim: toplam yükseklik değişimi / toplam mesafe * 100 (%)
  const avgSlope = totalDistM > 0
    ? ((totalAscent + totalDescent) / totalDistM) * 100
    : 0

  const stats: ElevationStats = {
    minElevation: Math.round(minElevation),
    maxElevation: Math.round(maxElevation),
    avgElevation: coords.length > 0 ? Math.round(elevSum / coords.length) : 0,
    totalAscent: Math.round(totalAscent),
    totalDescent: Math.round(totalDescent),
    totalDistance: Math.round(cumulativeDist / 10) / 100,
    maxSlope: Math.round(maxSlope * 10) / 10,
    avgSlope: Math.round(avgSlope * 10) / 10,
  }

  return { points, stats }
}

/** Düz hat modu: ORS Elevation Line */
export async function fetchStraightElevation(
  waypoints: [number, number][],
  signal?: AbortSignal,
): Promise<{ points: ElevationPoint[]; stats: ElevationStats }> {
  const interpolated = interpolatePoints(waypoints)

  const res = await fetch(`${BASE}/elevation/line`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': KEY,
    },
    body: JSON.stringify({
      format_in: 'geojson',
      format_out: 'geojson',
      geometry: {
        type: 'LineString',
        coordinates: interpolated,
      },
    }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null) as { error?: string; message?: string } | null
    throw new Error(json?.message ?? json?.error ?? `ORS Elevation hatası (${res.status})`)
  }

  const data = await res.json() as { geometry: { coordinates: [number, number, number][] } }
  const coords = data.geometry?.coordinates
  if (!coords?.length) throw new Error('Yükseklik verisi alınamadı.')

  return computeElevationPoints(coords)
}
