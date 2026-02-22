/**
 * ArcGIS-style buffer analysis
 * Düzlem (planar), dissolve, negatif buffer, multi-ring, tek taraflı (çizgi)
 */

import * as turf from '@turf/turf'
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  Point,
  Polygon,
} from 'geojson'

export type BufferDissolve = 'none' | 'all'
/** ArcGIS Side Type: Tam = her iki taraf, Sol/Sağ = çizgi için tek taraflı (topolojik) */
export type BufferSideType = 'full' | 'left' | 'right'

export interface BufferOptions {
  distance: number
  units: turf.Units
  dissolve: BufferDissolve
  sideType?: BufferSideType
}

const GEOMETRY_COLLECTION = 'GeometryCollection'
const POLYGON = 'Polygon'
const LINE_STRING = 'LineString'
const MULTI_LINE_STRING = 'MultiLineString'

function isBufferable(g: Geometry): g is Exclude<Geometry, GeometryCollection> {
  return g.type !== GEOMETRY_COLLECTION
}

function isLine(g: Geometry): g is LineString | MultiLineString {
  return g.type === LINE_STRING || g.type === MULTI_LINE_STRING
}

/** Çizgi için tek taraflı buffer: lineOffset + orijinal çizgi ile kapatılan poligon */
function oneSidedLineBuffer(
  line: Feature<LineString>,
  distance: number,
  units: turf.Units,
  side: 'left' | 'right'
): Feature<Polygon> | null {
  try {
    const offsetDist = side === 'right' ? distance : -distance
    const offset = turf.lineOffset(line, offsetDist, { units })
    const lineCoords = line.geometry.coordinates
    const offsetCoords = offset.geometry.coordinates
    if (lineCoords.length < 2 || offsetCoords.length < 2) return null
    const ring = [
      ...lineCoords,
      ...offsetCoords.slice().reverse(),
      lineCoords[0],
    ]
    return turf.polygon([ring]) as Feature<Polygon>
  } catch {
    return null
  }
}

function toFeatures(geometry: Geometry): Feature[] {
  if (geometry.type === GEOMETRY_COLLECTION) return []
  const flattened = turf.flatten(turf.feature(geometry))
  return (flattened as FeatureCollection).features
}

export function runBufferAnalysis(
  geometry: Geometry,
  options: BufferOptions
): Geometry | null {
  if (!isBufferable(geometry)) return null
  const { distance, units, dissolve, sideType = 'full' } = options
  if (distance === 0) return null

  const features = toFeatures(geometry)
  if (features.length === 0) return null

  const buffered: Feature<Polygon>[] = []
  for (const f of features) {
    const geom = f.geometry
    if (!isBufferable(geom)) continue
    try {
      if (isLine(geom) && (sideType === 'left' || sideType === 'right')) {
        const oneSided = oneSidedLineBuffer(
          f as Feature<LineString>,
          Math.abs(distance),
          units,
          sideType
        )
        if (oneSided?.geometry?.type === POLYGON) buffered.push(oneSided)
      } else {
        const b = turf.buffer(f as Feature<Point | LineString | Polygon>, distance, {
          units,
          steps: 8,
        })
        if (b?.geometry?.type === POLYGON) buffered.push(b as Feature<Polygon>)
      }
    } catch {
      continue
    }
  }
  if (buffered.length === 0) return null

  if (dissolve === 'all' && buffered.length > 1) {
    try {
      const unioned = turf.union(turf.featureCollection(buffered))
      return unioned?.geometry ?? null
    } catch {
      return buffered.length === 1 ? buffered[0].geometry : null
    }
  }
  if (buffered.length === 1) return buffered[0].geometry
  return turf.multiPolygon(buffered.map(p => p.geometry.coordinates)).geometry
}

export function runMultiRingBuffer(
  geometry: Geometry,
  distances: number[],
  options: Omit<BufferOptions, 'distance'>
): Geometry[] {
  const results: Geometry[] = []
  for (const d of distances) {
    const g = runBufferAnalysis(geometry, { ...options, distance: d })
    if (g) results.push(g)
  }
  return results
}

export function runBufferAnalysisForMultipleGeometries(
  geometries: Geometry[],
  options: BufferOptions
): Geometry | null {
  if (geometries.length === 0) return null
  if (geometries.length === 1) return runBufferAnalysis(geometries[0], options)
  const allFeatures = geometries.flatMap(g => toFeatures(g))
  if (allFeatures.length === 0) return null
  const { distance, units, dissolve, sideType = 'full' } = options
  if (distance === 0) return null

  const buffered: Feature<Polygon>[] = []
  for (const f of allFeatures) {
    const geom = f.geometry
    if (!isBufferable(geom)) continue
    try {
      if (isLine(geom) && (sideType === 'left' || sideType === 'right')) {
        const oneSided = oneSidedLineBuffer(
          f as Feature<LineString>,
          Math.abs(distance),
          units,
          sideType
        )
        if (oneSided?.geometry?.type === POLYGON) buffered.push(oneSided)
      } else {
        const b = turf.buffer(f as Feature<Point | LineString | Polygon>, distance, {
          units,
          steps: 8,
        })
        if (b?.geometry?.type === POLYGON) buffered.push(b as Feature<Polygon>)
      }
    } catch {
      continue
    }
  }
  if (buffered.length === 0) return null

  if (dissolve === 'all' && buffered.length > 1) {
    try {
      const unioned = turf.union(turf.featureCollection(buffered))
      return unioned?.geometry ?? null
    } catch {
      return buffered.length === 1 ? buffered[0].geometry : null
    }
  }
  if (buffered.length === 1) return buffered[0].geometry
  return turf.multiPolygon(buffered.map(p => p.geometry.coordinates)).geometry
}
