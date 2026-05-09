import * as turf from '@turf/turf'
import type {
  BBox,
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from 'geojson'

type SupportedGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon

export interface PreparedNearestGeometry {
  id: string
  feature: Feature<SupportedGeometry>
  bbox: BBox
  vertices: Feature<Point>[]
  lines: Feature<LineString>[]
}

export interface GeometryNearestConnection {
  distanceKm: number
  from: Position
  to: Position
}

function isSupportedGeometry(geometry: Geometry): geometry is SupportedGeometry {
  return (
    geometry.type === 'Point'
    || geometry.type === 'MultiPoint'
    || geometry.type === 'LineString'
    || geometry.type === 'MultiLineString'
    || geometry.type === 'Polygon'
    || geometry.type === 'MultiPolygon'
  )
}

function toPointFeature(coord: Position): Feature<Point> {
  return turf.point([coord[0], coord[1]])
}

function coordsToUniquePoints(coords: Position[]): Feature<Point>[] {
  const unique = new Set<string>()
  const points: Feature<Point>[] = []

  for (const coord of coords) {
    const key = `${coord[0].toFixed(10)},${coord[1].toFixed(10)}`
    if (unique.has(key)) continue
    unique.add(key)
    points.push(toPointFeature(coord))
  }

  return points
}

function polygonOrLineToLineStrings(feature: Feature<SupportedGeometry>): Feature<LineString>[] {
  const geometry = feature.geometry

  if (geometry.type === 'LineString') {
    return [feature as Feature<LineString>]
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates.map((coords) => turf.lineString(coords))
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    const converted = turf.polygonToLine(feature as Feature<Polygon | MultiPolygon>)
    if (converted.type === 'FeatureCollection') {
      return converted.features.flatMap((f) => polygonOrLineToLineStrings(f as Feature<SupportedGeometry>))
    }
    return polygonOrLineToLineStrings(converted as Feature<SupportedGeometry>)
  }

  return []
}

export function prepareNearestGeometries(
  input: FeatureCollection<Geometry>,
): PreparedNearestGeometry[] {
  const prepared: PreparedNearestGeometry[] = []

  input.features.forEach((feature, index) => {
    if (!feature.geometry || !isSupportedGeometry(feature.geometry)) return

    const safeFeature: Feature<SupportedGeometry> = {
      type: 'Feature',
      geometry: feature.geometry,
      properties: feature.properties ?? {},
    }

    const id = String(
      (feature.properties?.itemId as string | number | undefined)
      ?? (feature.id as string | number | undefined)
      ?? index,
    )

    prepared.push({
      id,
      feature: safeFeature,
      bbox: turf.bbox(safeFeature) as BBox,
      vertices: coordsToUniquePoints(turf.coordAll(safeFeature)),
      lines: polygonOrLineToLineStrings(safeFeature),
    })
  })

  return prepared
}

export function bboxGapDistanceKm(a: BBox, b: BBox): number {
  const [aMinX, aMinY, aMaxX, aMaxY] = a
  const [bMinX, bMinY, bMaxX, bMaxY] = b

  const overlapX = !(aMaxX < bMinX || bMaxX < aMinX)
  const overlapY = !(aMaxY < bMinY || bMaxY < aMinY)

  if (overlapX && overlapY) return 0

  const ax = aMaxX < bMinX ? aMaxX : aMinX > bMaxX ? aMinX : Math.max(aMinX, bMinX)
  const bx = aMaxX < bMinX ? bMinX : aMinX > bMaxX ? bMaxX : ax
  const ay = aMaxY < bMinY ? aMaxY : aMinY > bMaxY ? aMinY : Math.max(aMinY, bMinY)
  const by = aMaxY < bMinY ? bMinY : aMinY > bMaxY ? bMaxY : ay

  return turf.distance([ax, ay], [bx, by], { units: 'kilometers' })
}

export function computeNearestGeometryConnection(
  a: PreparedNearestGeometry,
  b: PreparedNearestGeometry,
): GeometryNearestConnection | null {
  if (a.vertices.length === 0 || b.vertices.length === 0) return null

  if (turf.booleanIntersects(a.feature, b.feature)) {
    const anchor = a.vertices[0].geometry.coordinates
    return {
      distanceKm: 0,
      from: anchor,
      to: anchor,
    }
  }

  let bestDistance = Number.POSITIVE_INFINITY
  let bestFrom: Position | null = null
  let bestTo: Position | null = null

  const registerBest = (from: Position, to: Position, distanceKm: number) => {
    if (distanceKm >= bestDistance) return
    bestDistance = distanceKm
    bestFrom = from
    bestTo = to
  }

  const compareVertices = (left: Feature<Point>[], right: Feature<Point>[]) => {
    for (const p1 of left) {
      for (const p2 of right) {
        const dist = turf.distance(p1, p2, { units: 'kilometers' })
        registerBest(p1.geometry.coordinates, p2.geometry.coordinates, dist)
      }
    }
  }

  const projectVerticesToLines = (
    vertices: Feature<Point>[],
    lines: Feature<LineString>[],
    reverse = false,
  ) => {
    for (const point of vertices) {
      for (const line of lines) {
        const nearest = turf.nearestPointOnLine(line, point, { units: 'kilometers' })
        const dist = turf.distance(point, nearest, { units: 'kilometers' })
        if (reverse) {
          registerBest(nearest.geometry.coordinates, point.geometry.coordinates, dist)
        } else {
          registerBest(point.geometry.coordinates, nearest.geometry.coordinates, dist)
        }
      }
    }
  }

  if (a.lines.length > 0) {
    projectVerticesToLines(b.vertices, a.lines, true)
  }
  if (b.lines.length > 0) {
    projectVerticesToLines(a.vertices, b.lines, false)
  }

  if (a.lines.length === 0 || b.lines.length === 0) {
    compareVertices(a.vertices, b.vertices)
  }

  if (!bestFrom || !bestTo || !Number.isFinite(bestDistance)) return null

  return {
    distanceKm: bestDistance,
    from: bestFrom,
    to: bestTo,
  }
}
