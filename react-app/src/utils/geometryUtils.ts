/**
 * Geometry Utilities
 * Calculate centroids and geometric properties for GeoJSON features
 * Uses polylabel for cartographic label placement and turf's pointOnFeature
 * as a safe fallback.
 */

import { pointOnFeature } from '@turf/turf'
import polylabel from 'polylabel'

type Coordinate = [number, number]
type Polygon = Coordinate[][]
type MultiPolygon = Coordinate[][][]

const POLYLABEL_PRECISION = 0.001

/**
 * Calculate centroid for a polygon geometry
 * Uses turf pointOnFeature to guarantee the point falls inside the polygon.
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
 * Polylabel finds the point farthest from polygon edges, which is usually
 * more readable for map labels than bbox centers or per-province offsets.
 */
export function calculateLabelPoint(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): Coordinate {
  try {
    const polygon = getPolygonForLabel(geometry)
    if (!polygon) return calculateCentroid(geometry)

    const labelPoint = polylabel(polygon, POLYLABEL_PRECISION)
    return [labelPoint[0], labelPoint[1]]
  } catch {
    return calculateCentroid(geometry)
  }
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

function getPolygonForLabel(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): Polygon | null {
  if (geometry.type === 'Polygon') {
    return isValidPolygon(geometry.coordinates as Polygon) ? geometry.coordinates as Polygon : null
  }

  const multiPolygon = geometry.coordinates as MultiPolygon
  let largestPolygon: Polygon | null = null
  let largestArea = -Infinity

  for (const polygon of multiPolygon) {
    if (!isValidPolygon(polygon)) continue

    const area = Math.abs(calculateRingArea(polygon[0]))
    if (area > largestArea) {
      largestArea = area
      largestPolygon = polygon
    }
  }

  return largestPolygon
}

function isValidPolygon(polygon: Polygon): boolean {
  return Array.isArray(polygon)
    && polygon.length > 0
    && Array.isArray(polygon[0])
    && polygon[0].length >= 4
}

function calculateRingArea(ring: Coordinate[]): number {
  let area = 0

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i]
    const previous = ring[j]
    area += (previous[0] * current[1]) - (current[0] * previous[1])
  }

  return area / 2
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
