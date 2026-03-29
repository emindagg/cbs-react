import { strFromU8, unzipSync } from 'fflate'
import type { FeatureCollection, Feature, Geometry, Position } from 'geojson'
import proj4 from 'proj4'

/** ZIP içinden ilk .prj metnini okur (path'te __MACOSX yok sayılır). */
export function readPrjWktFromShapefileZip(buffer: ArrayBuffer): string | undefined {
  try {
    const files = unzipSync(new Uint8Array(buffer))
    const keys = Object.keys(files).filter(k => !k.includes('__MACOSX'))
    for (const key of keys) {
      if (key.toLowerCase().endsWith('.prj')) {
        return strFromU8(files[key]).trim()
      }
    }
  } catch {
    return undefined
  }
  return undefined
}

/** Kaynak CRS WGS84 / EPSG:4326 ise true (dönüşüm gerekmez). */
export function isWgs84Prj(wkt: string): boolean {
  const t = wkt.trim()
  if (t.length === 0) {
    return true
  }
  if (/AUTHORITY\s*\[\s*"EPSG"\s*,\s*"4326"\s*\]/i.test(t)) {
    return true
  }
  if (/EPSG:\s*4326\b/i.test(t)) {
    return true
  }
  const u = t.toUpperCase()
  if (u.includes('WGS_1984') || u.includes('GCS_WGS_1984')) {
    return true
  }
  if (u.includes('WORLD GEODETIC SYSTEM 1984')) {
    return true
  }
  if (/\bGEOGCS\b/i.test(t) && /\bWGS\s*84\b/i.test(t)) {
    return true
  }
  return false
}

function pickXY(pos: Position): [number, number] | undefined {
  if (pos.length < 2) {
    return undefined
  }
  return [pos[0], pos[1]]
}

function sampleFirstXYFromGeometry(geom: Geometry | null | undefined): [number, number] | undefined {
  if (!geom) {
    return undefined
  }
  switch (geom.type) {
    case 'Point':
      return pickXY(geom.coordinates)
    case 'LineString':
    case 'MultiPoint': {
      const p = geom.coordinates[0]
      return p ? pickXY(p) : undefined
    }
    case 'Polygon':
    case 'MultiLineString': {
      const ring = geom.coordinates[0]
      const p = ring?.[0]
      return p ? pickXY(p) : undefined
    }
    case 'MultiPolygon': {
      const ring = geom.coordinates[0]?.[0]
      const p = ring?.[0]
      return p ? pickXY(p) : undefined
    }
    case 'GeometryCollection': {
      for (const g of geom.geometries) {
        const xy = sampleFirstXYFromGeometry(g)
        if (xy) {
          return xy
        }
      }
      return undefined
    }
    default:
      return undefined
  }
}

function sampleFirstXYFromFeatureCollection(fc: FeatureCollection): [number, number] | undefined {
  for (const f of fc.features) {
    const xy = sampleFirstXYFromGeometry(f.geometry)
    if (xy) {
      return xy
    }
  }
  return undefined
}

function looksLikeGeographicCoords(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y)
    && Math.abs(x) <= 180
    && Math.abs(y) <= 90
}

function mapPosition(
  forward: (xy: [number, number]) => [number, number],
  pos: Position,
): Position {
  const [x, y, ...rest] = pos
  const [nx, ny] = forward([x, y])
  if (rest.length > 0) {
    return [nx, ny, ...rest] as Position
  }
  return [nx, ny]
}

function transformGeometry(geom: Geometry, mapPos: (p: Position) => Position): Geometry {
  switch (geom.type) {
    case 'Point':
      return { ...geom, coordinates: mapPos(geom.coordinates) }
    case 'MultiPoint':
    case 'LineString':
      return { ...geom, coordinates: geom.coordinates.map(c => mapPos(c)) }
    case 'Polygon':
    case 'MultiLineString':
      return { ...geom, coordinates: geom.coordinates.map(ring => ring.map(c => mapPos(c))) }
    case 'MultiPolygon':
      return {
        ...geom,
        coordinates: geom.coordinates.map(poly => poly.map(ring => ring.map(c => mapPos(c)))),
      }
    case 'GeometryCollection':
      return {
        ...geom,
        geometries: geom.geometries.map(g => transformGeometry(g, mapPos)),
      }
    default:
      return geom
  }
}

/**
 * PRJ varsa ve WGS84 değilse, koordinatlar coğrafi görünmüyorsa (shpjs projeksiyon
 * uygulayamadıysa) proj4 ile EPSG:4326'ya dönüştürür.
 */
export function applyShapefilePrjToWgs84IfNeeded(
  fc: FeatureCollection,
  prjWkt: string | undefined,
): FeatureCollection {
  if (prjWkt === undefined || prjWkt.trim() === '') {
    return fc
  }
  if (isWgs84Prj(prjWkt)) {
    return fc
  }
  let forward: (xy: [number, number]) => [number, number]
  try {
    const tr = proj4(prjWkt, 'EPSG:4326')
    forward = (pos) => {
      const out = tr.forward(pos)
      return [out[0], out[1]]
    }
  } catch {
    return fc
  }
  const sample = sampleFirstXYFromFeatureCollection(fc)
  if (sample === undefined) {
    return fc
  }
  const [sx, sy] = sample
  if (looksLikeGeographicCoords(sx, sy)) {
    return fc
  }
  const mapPos = (p: Position) => mapPosition(forward, p)
  const features: Feature[] = fc.features.map((f) => ({
    ...f,
    geometry: f.geometry ? transformGeometry(f.geometry, mapPos) : f.geometry,
  }))
  return { ...fc, features }
}
