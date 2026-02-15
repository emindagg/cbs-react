/**
 * Distance Tool Utilities
 * Formatting and calculation helpers
 */

import * as turf from '@turf/turf'

export function formatDistance(val: number): string {
  // Turkish locale for comma separator
  if (val < 1) return `${(val * 1000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`
  return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`
}

export function formatArea(val: number): string {
  if (val >= 1000000) return `${(val / 1000000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²`
  return `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
}

export function calculateMeasurement(points: [number, number][], isClosed: boolean): number {
  if (points.length < 2) return 0

  if (isClosed) {
    const poly = turf.polygon([points])
    return turf.area(poly)
  } else {
    const line = turf.lineString(points)
    return turf.length(line, { units: 'kilometers' })
  }
}

export function calculatePerimeter(points: [number, number][], isClosed: boolean): number {
  if (!isClosed) return 0
  const line = turf.lineString(points)
  return turf.length(line, { units: 'kilometers' })
}

export function calculateTempDistance(points: [number, number][], ghostPoint: [number, number] | null): number {
  if (!ghostPoint || points.length === 0) return 0
  const currentPoints: [number, number][] = [...points, ghostPoint]
  if (currentPoints.length < 2) return 0
  const line = turf.lineString(currentPoints)
  return turf.length(line, { units: 'kilometers' })
}
