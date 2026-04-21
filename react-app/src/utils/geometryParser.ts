import { wktToGeoJSON } from 'betterknown'
import type { Geometry } from 'geojson'

const GEOJSON_GEOMETRY_TYPES = new Set([
  'Point', 'MultiPoint', 'LineString', 'MultiLineString',
  'Polygon', 'MultiPolygon', 'GeometryCollection',
])

const WKT_PREFIX = /^\s*(SRID=\d+;)?\s*(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)/i

function tryParseGeoJSONString(value: string): Geometry | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      parsed !== null
      && typeof parsed === 'object'
      && 'type' in parsed
      && typeof (parsed as Record<string, unknown>).type === 'string'
      && GEOJSON_GEOMETRY_TYPES.has((parsed as Record<string, unknown>).type as string)
    ) {
      return parsed as Geometry
    }
  } catch {
    // JSON parse hatasi — GeoJSON degil
  }
  return null
}

function tryParseWKT(value: string): Geometry | null {
  if (!WKT_PREFIX.test(value)) {
    return null
  }
  try {
    return wktToGeoJSON(value)
  } catch {
    return null
  }
}

function tryParseLatLonSemicolon(
  value: string,
  typeHint?: string,
): Geometry | null {
  if (!value.includes(',')) {
    return null
  }
  const parts = value.split(';').map(p => {
    const nums = p.trim().split(',').map(Number)
    if (nums.length >= 2 && Number.isFinite(nums[0]) && Number.isFinite(nums[1])) {
      return [nums[1], nums[0]] as [number, number]
    }
    return null
  })
  const coords = parts.filter((c): c is [number, number] => c !== null)
  if (coords.length === 0) {
    return null
  }

  const hint = (typeHint ?? '').toLowerCase().trim()
  if (hint === 'polygon' || hint === 'area' || hint === 'alan') {
    return { type: 'Polygon', coordinates: [coords] }
  }
  if (hint === 'line' || hint === 'linestring' || hint === 'route' || hint === 'rota') {
    return { type: 'LineString', coordinates: coords }
  }
  if (coords.length === 1) {
    return { type: 'Point', coordinates: coords[0] }
  }
  return { type: 'LineString', coordinates: coords }
}

/**
 * Geometry string'i parse eder. Sirasyla dener:
 * 1. GeoJSON string ({"type":"Point",...})
 * 2. WKT / EWKT (POINT(29 41), POLYGON((...)))
 * 3. lat,lon;lat,lon formatı (typeHint ile polygon/line ayrimi)
 */
export function parseGeometryString(
  value: string,
  typeHint?: string,
): Geometry | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  if (trimmed.startsWith('{')) {
    const geojson = tryParseGeoJSONString(trimmed)
    if (geojson) return geojson
  }

  const wkt = tryParseWKT(trimmed)
  if (wkt) return wkt

  return tryParseLatLonSemicolon(trimmed, typeHint)
}

/**
 * GeoJSON Geometry tipinden uygulama ici DataItem tipine donusturur.
 */
export function geometryTypeToItemType(geomType: string): 'point' | 'line' | 'polygon' {
  switch (geomType) {
    case 'Point':
    case 'MultiPoint':
      return 'point'
    case 'LineString':
    case 'MultiLineString':
      return 'line'
    case 'Polygon':
    case 'MultiPolygon':
      return 'polygon'
    default:
      return 'point'
  }
}
