/**
 * GeoJSON Geometry Type Guards
 * 
 * Runtime type checking with TypeScript type narrowing for GeoJSON geometries.
 */

// Accept both standard GeoJSON.Geometry and custom GeoJSONGeometry
type GeometryInput = GeoJSON.Geometry | { type: string; coordinates: unknown }

export function isPolygon(geometry: GeometryInput): geometry is GeoJSON.Polygon {
  return geometry.type === 'Polygon'
}

export function isMultiPolygon(geometry: GeometryInput): geometry is GeoJSON.MultiPolygon {
  return geometry.type === 'MultiPolygon'
}

export function isPolygonOrMultiPolygon(
  geometry: GeometryInput,
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

export function isPoint(geometry: GeometryInput): geometry is GeoJSON.Point {
  return geometry.type === 'Point'
}

export function isMultiPoint(geometry: GeometryInput): geometry is GeoJSON.MultiPoint {
  return geometry.type === 'MultiPoint'
}

export function isLineString(geometry: GeometryInput): geometry is GeoJSON.LineString {
  return geometry.type === 'LineString'
}

export function isMultiLineString(geometry: GeometryInput): geometry is GeoJSON.MultiLineString {
  return geometry.type === 'MultiLineString'
}
