import type { GeoItem } from '../types'

interface GeoJSONInput {
  type?: string
  features?: Array<GeoJSONFeature>
  geometries?: Array<Record<string, unknown>>
  geometry?: GeoJSON.Geometry
}

interface GeoJSONFeature {
  type: string
  geometry?: GeoJSON.Geometry
  properties?: Record<string, unknown>
}

/**
 * Process GeoJSON data into GeoItems
 */
export function parseGeoJSON(geojson: GeoJSONInput, fileName: string): GeoItem[] {
  let features: GeoJSONFeature[] = []

  if (geojson.type === 'FeatureCollection' && geojson.features) {
    features = geojson.features
  } else if (geojson.type === 'Feature' && geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: geojson as Record<string, unknown> }]
  } else if (geojson.type === 'GeometryCollection' && geojson.geometries) {
    features = geojson.geometries.map((geom) => ({
      type: 'Feature',
      geometry: geom as GeoJSON.Geometry,
      properties: {},
    }))
  } else if (geojson.geometry) {
    features = [{ type: 'Feature', geometry: geojson.geometry, properties: {} }]
  }

  const items: GeoItem[] = []

  features.forEach((feature, index) => {
    if (feature.geometry) {
      let type: 'point' | 'line' | 'polygon' | 'circle' = 'point'
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
        date: new Date().toISOString(),
      })
    }
  })

  return items
}
