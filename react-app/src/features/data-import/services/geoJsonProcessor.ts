import { extractDateFromProperties } from '@/utils/dateParser'

import type { GeoItem } from '../types'

interface GeoJSONInput {
  type?: string
  features?: Array<GeoJSONFeature>
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

export function parseGeoJSON(geojson: GeoJSONInput, fileName: string): GeoItem[] {
  let features: GeoJSONFeature[] = []

  if (geojson.type === 'FeatureCollection' && geojson.features) {
    features = geojson.features
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: geojson.properties ?? {} }]
  } else if (geojson.type === 'GeometryCollection' && geojson.geometries) {
    features = geojson.geometries.map((geom) => ({
      type: 'Feature',
      geometry: geom as unknown as GeoJSON.Geometry,
      properties: {},
    }))
  } else if (geojson.type && BARE_GEOMETRY_TYPES.has(geojson.type)) {
    features = [{ type: 'Feature', geometry: geojson as unknown as GeoJSON.Geometry, properties: {} }]
  } else if (geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: {} }]
  }

  const items: GeoItem[] = []

  features.forEach((feature, index) => {
    if (feature.geometry) {
      let type: 'point' | 'line' | 'polygon' = 'point'
      const gType = feature.geometry.type

      if (gType === 'Point' || gType === 'MultiPoint') type = 'point'
      else if (gType === 'LineString' || gType === 'MultiLineString') type = 'line'
      else if (gType === 'Polygon' || gType === 'MultiPolygon') type = 'polygon'

      items.push({
        name: (feature.properties?.name as string) || `${fileName} - ${index + 1}`,
        type: type,
        geometry: feature.geometry,
        properties: feature.properties || {},
        visible: true,
        date: extractDateFromProperties(feature.properties),
      })
    }
  })

  return items
}
