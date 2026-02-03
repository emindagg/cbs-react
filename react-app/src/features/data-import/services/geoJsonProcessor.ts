import type { GeoItem } from '../types'

/**
 * Process GeoJSON data into GeoItems
 */
export function parseGeoJSON(geojson: any, fileName: string): GeoItem[] {
  let features: any[] = []

  if (geojson.type === 'FeatureCollection') {
    features = geojson.features
  } else if (geojson.type === 'Feature') {
    features = [geojson]
  } else if (geojson.type === 'GeometryCollection') {
    features = geojson.geometries.map((geom: any) => ({
      type: 'Feature',
      geometry: geom,
      properties: {},
    }))
  } else {
    features = [{ type: 'Feature', geometry: geojson, properties: {} }]
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
        name: feature.properties?.name || `${fileName} - ${index + 1}`,
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
