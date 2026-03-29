import type { NewDataItem } from '../../types'
import { extractDateFromProperties } from '../../utils/dateParser'

interface GeoJSONInput {
  type?: string
  features?: GeoJSONFeature[]
  geometries?: Array<Record<string, unknown>>
  geometry?: GeoJSON.Geometry
  properties?: Record<string, unknown>
}

interface GeoJSONFeature {
  type: string
  geometry?: GeoJSON.Geometry
  properties?: Record<string, unknown>
}

const BARE_GEOMETRY_TYPES = new Set([
  'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon',
])

export function parseGeoJSON(geojson: GeoJSONInput, fileName: string): NewDataItem[] {
  let features: GeoJSONFeature[] = []

  if (geojson.type === 'FeatureCollection' && geojson.features) {
    features = geojson.features
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: geojson.properties ?? {} }]
  } else if (geojson.type === 'GeometryCollection' && geojson.geometries) {
    features = geojson.geometries.map(geom => ({
      type: 'Feature',
      geometry: geom as unknown as GeoJSON.Geometry,
      properties: {},
    }))
  } else if (geojson.type && BARE_GEOMETRY_TYPES.has(geojson.type)) {
    features = [{ type: 'Feature', geometry: geojson as unknown as GeoJSON.Geometry, properties: {} }]
  } else if (geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: {} }]
  }

  const items: NewDataItem[] = []

  features.forEach((feature, index) => {
    if (!feature.geometry) return

    let type: NewDataItem['type'] = 'point'
    const geometryType = feature.geometry.type

    if (geometryType === 'Point' || geometryType === 'MultiPoint') type = 'point'
    else if (geometryType === 'LineString' || geometryType === 'MultiLineString') type = 'line'
    else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') type = 'polygon'

    items.push({
      name: (feature.properties?.name as string) || `${fileName} - ${index + 1}`,
      type,
      geometry: feature.geometry,
      properties: feature.properties || {},
      date: extractDateFromProperties(feature.properties),
    })
  })

  return items
}

