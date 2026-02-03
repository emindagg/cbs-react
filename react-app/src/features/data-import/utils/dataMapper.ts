import type { ColumnMapping, GeoItem } from '../types'

/**
 * Transform raw JSON data to GeoItems using column mapping
 */
export function transformToGeoItems(jsonData: Record<string, unknown>[], mapping: ColumnMapping): GeoItem[] {
  return jsonData.map((row: Record<string, unknown>, index: number) => {
    let geometry: GeoJSON.Geometry | null = null

    // Parse geometry string if exists (format: "lat,lon;lat,lon")
    if (mapping.geometry && row[mapping.geometry]) {
      try {
        const points = row[mapping.geometry].split(';').map((p: string) => {
          const [lat, lon] = p.split(',').map(Number)
          if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
          return null
        }).filter(Boolean)

        if (points.length > 0) {
          const type = mapping.type ? row[mapping.type] : 'point'
          if (type === 'polygon' || type === 'area' || type === 'alan') {
            geometry = { type: 'Polygon', coordinates: [points.map((p: { lat: number; lon: number }) => [p.lon, p.lat])] }
          } else if (type === 'line' || type === 'route' || type === 'rota') {
            geometry = { type: 'LineString', coordinates: points.map((p: { lat: number; lon: number }) => [p.lon, p.lat]) }
          } else {
            geometry = { type: 'Point', coordinates: [points[0].lon, points[0].lat] }
          }
        }
      } catch (e) {
        console.warn('Geometry parse error', e)
      }
    }

    // Fallback to basic point
    if (!geometry) {
      if (mapping.lat && mapping.lon) {
        const lat = Number(row[mapping.lat])
        const lon = Number(row[mapping.lon])
        if (!isNaN(lat) && !isNaN(lon)) {
          geometry = { type: 'Point', coordinates: [lon, lat] }
        }
      }
    }

    if (!geometry) return null

    return {
      name: mapping.name ? row[mapping.name] : `Item ${index + 1}`,
      type: String(mapping.type ? row[mapping.type] : 'point')
        ?.toLowerCase()
        ?.replace('rota', 'line')
        .replace('alan', 'polygon') || 'point',
      geometry: geometry,
      properties: row,
      visible: true,
      date: new Date().toISOString(),
    } as GeoItem
  }).filter(Boolean) as GeoItem[]
}
