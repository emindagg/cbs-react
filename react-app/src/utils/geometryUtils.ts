/**
 * Geometry Utilities
 * Calculate centroids and geometric properties for GeoJSON features
 * Uses turf's pointOnFeature for guaranteed point-in-polygon placement
 */

import { pointOnFeature } from '@turf/turf'

type Coordinate = [number, number]
type Polygon = Coordinate[][]
type MultiPolygon = Coordinate[][][]

const ERZINCAN_LABEL_KEY = 'erzincan'
const ANTALYA_LABEL_KEY = 'antalya'
const ERZINCAN_LABEL_LEFT_OFFSET_RATIO = 0.5
const ERZINCAN_LABEL_TOP_OFFSET_RATIO = 0.2
const ANTALYA_LABEL_TOP_OFFSET_RATIO = 0.3

/**
 * Calculate centroid for a polygon geometry
 * Uses turf pointOnFeature (pole of inaccessibility approximation)
 * to guarantee the point falls inside the polygon — important for
 * concave shapes like Antalya.
 * Falls back to simple average if turf fails.
 */
export function calculateCentroid(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): Coordinate {
  try {
    const feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> = {
      type: 'Feature',
      properties: {},
      geometry,
    }
    const pt = pointOnFeature(feature)
    return pt.geometry.coordinates as Coordinate
  } catch {
    // Fallback to simple average
    if (geometry.type === 'Polygon') {
      return calculatePolygonCentroidSimple(geometry.coordinates as Polygon)
    }
    return calculateMultiPolygonCentroidSimple(geometry.coordinates as MultiPolygon)
  }
}

/**
 * Calculate a label point for province/district names.
 * Some provinces use small cartographic overrides within their own bbox.
 */
export function calculateLabelPoint(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  label: string,
): Coordinate {
  const labelPoint = calculateCentroid(geometry)
  const labelKey = normalizeLabelKey(label)

  if (labelKey !== ERZINCAN_LABEL_KEY && labelKey !== ANTALYA_LABEL_KEY) {
    return labelPoint
  }

  const bounds = calculateBounds(geometry)
  const minLng = bounds[0]
  const maxLat = bounds[3]
  if (!Number.isFinite(minLng) || !Number.isFinite(maxLat)) {
    return labelPoint
  }

  const [lng, lat] = labelPoint
  if (labelKey === ANTALYA_LABEL_KEY) {
    return [
      lng,
      lat + (maxLat - lat) * ANTALYA_LABEL_TOP_OFFSET_RATIO,
    ]
  }

  return [
    lng + (minLng - lng) * ERZINCAN_LABEL_LEFT_OFFSET_RATIO,
    lat + (maxLat - lat) * ERZINCAN_LABEL_TOP_OFFSET_RATIO,
  ]
}

function normalizeLabelKey(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Simple average centroid (fallback)
 */
function calculatePolygonCentroidSimple(coordinates: Polygon): Coordinate {
  const ring = coordinates[0]

  if (!ring || ring.length === 0) {
    return [0, 0]
  }

  let sumLng = 0
  let sumLat = 0
  let count = 0

  for (const coord of ring) {
    if (coord && coord.length >= 2) {
      sumLng += coord[0]
      sumLat += coord[1]
      count++
    }
  }

  if (count === 0) {
    return [0, 0]
  }

  return [sumLng / count, sumLat / count]
}

/**
 * Simple average centroid for multi-polygon (fallback)
 */
function calculateMultiPolygonCentroidSimple(coordinates: MultiPolygon): Coordinate {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0]
  }

  let largestPolygon: Polygon = coordinates[0]
  let maxPoints = 0

  for (const polygon of coordinates) {
    const ring = polygon[0]
    if (ring && ring.length > maxPoints) {
      maxPoints = ring.length
      largestPolygon = polygon
    }
  }

  return calculatePolygonCentroidSimple(largestPolygon)
}

/**
 * Calculate bounding box for a geometry
 * Returns [minLng, minLat, maxLng, maxLat]
 */
export function calculateBounds(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number, number, number] {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  const processCoordinate = (coord: Coordinate) => {
    if (coord && coord.length >= 2) {
      minLng = Math.min(minLng, coord[0])
      minLat = Math.min(minLat, coord[1])
      maxLng = Math.max(maxLng, coord[0])
      maxLat = Math.max(maxLat, coord[1])
    }
  }

  if (geometry.type === 'Polygon') {
    const polygon = geometry.coordinates as Polygon
    for (const ring of polygon) {
      for (const coord of ring) {
        processCoordinate(coord)
      }
    }
  } else if (geometry.type === 'MultiPolygon') {
    const multiPolygon = geometry.coordinates as MultiPolygon
    for (const polygon of multiPolygon) {
      for (const ring of polygon) {
        for (const coord of ring) {
          processCoordinate(coord)
        }
      }
    }
  }

  return [minLng, minLat, maxLng, maxLat]
}

/**
 * Get center point of bounding box
 */
export function getBoundsCenter(bounds: [number, number, number, number]): Coordinate {
  const [minLng, minLat, maxLng, maxLat] = bounds
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
}
