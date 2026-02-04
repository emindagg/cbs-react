/**
 * Geometry Utilities
 * Calculate centroids and geometric properties for GeoJSON features
 */

type Coordinate = [number, number]
type Polygon = Coordinate[][]
type MultiPolygon = Coordinate[][][]

interface Geometry {
  type: string
  coordinates: Polygon | MultiPolygon
}

/**
 * Calculate centroid for a polygon geometry
 * Returns [longitude, latitude] point
 */
export function calculateCentroid(geometry: Geometry): Coordinate {
  if (geometry.type === 'Polygon') {
    return calculatePolygonCentroid(geometry.coordinates as Polygon)
  } else if (geometry.type === 'MultiPolygon') {
    return calculateMultiPolygonCentroid(geometry.coordinates as MultiPolygon)
  }

  // Fallback: return [0, 0] if unknown geometry type
  console.warn('⚠️  Unknown geometry type:', geometry.type)
  return [0, 0]
}

/**
 * Calculate centroid for a simple polygon
 * Uses the exterior ring (first ring) only
 */
function calculatePolygonCentroid(coordinates: Polygon): Coordinate {
  const ring = coordinates[0] // Exterior ring

  if (!ring || ring.length === 0) {
    return [0, 0]
  }

  // Calculate simple average of coordinates
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
 * Calculate centroid for a multi-polygon
 * Uses the largest polygon by point count
 */
function calculateMultiPolygonCentroid(coordinates: MultiPolygon): Coordinate {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0]
  }

  // Find largest polygon by number of points
  let largestPolygon: Polygon = coordinates[0]
  let maxPoints = 0

  for (const polygon of coordinates) {
    const ring = polygon[0]
    if (ring && ring.length > maxPoints) {
      maxPoints = ring.length
      largestPolygon = polygon
    }
  }

  return calculatePolygonCentroid(largestPolygon)
}

/**
 * Calculate bounding box for a geometry
 * Returns [minLng, minLat, maxLng, maxLat]
 */
export function calculateBounds(geometry: Geometry): [number, number, number, number] {
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
