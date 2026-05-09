import * as turf from '@turf/turf'
import type { Geometry, LineString, MultiLineString, MultiPolygon, Polygon } from 'geojson'

const SQUARE_METERS_IN_KM2 = 1_000_000

function formatArea(squareMeters: number): string {
  if (squareMeters >= SQUARE_METERS_IN_KM2) {
    return `${(squareMeters / SQUARE_METERS_IN_KM2).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} km²`
  }

  return `${squareMeters.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m²`
}

function formatLength(kilometers: number): string {
  if (kilometers >= 1) {
    return `${kilometers.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} km`
  }

  return `${(kilometers * 1000).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`
}

function calculateRingLengthKm(ring: number[][]): number {
  if (ring.length < 2) return 0

  const first = ring[0]
  const last = ring[ring.length - 1]
  const closedRing = first && last && (first[0] !== last[0] || first[1] !== last[1])
    ? [...ring, first]
    : ring

  return turf.length(turf.lineString(closedRing), { units: 'kilometers' })
}

function calculatePolygonLengthKm(geometry: Polygon | MultiPolygon): number {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.coordinates

  return polygons.reduce((polygonTotal, rings) => (
    polygonTotal + rings.reduce((ringTotal, ring) => ringTotal + calculateRingLengthKm(ring), 0)
  ), 0)
}

function calculateLineLengthKm(geometry: LineString | MultiLineString): number {
  return turf.length({ type: 'Feature', geometry, properties: {} }, { units: 'kilometers' })
}

export interface GeometryMeasurements {
  area?: string
  length?: string
}

export function getGeometryMeasurements(geometry: Geometry): GeometryMeasurements {
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return {
      area: formatArea(turf.area({ type: 'Feature', geometry, properties: {} })),
      length: formatLength(calculatePolygonLengthKm(geometry)),
    }
  }

  if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
    return {
      length: formatLength(calculateLineLengthKm(geometry)),
    }
  }

  return {}
}
