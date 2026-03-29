import { extractDateFromProperties } from '@/utils/dateParser'

import type { ColumnMapping, GeoItem } from '../types'

export function transformToGeoItems(jsonData: Record<string, unknown>[], mapping: ColumnMapping): GeoItem[] {
  return jsonData.map((row: Record<string, unknown>, index: number) => {
    let geometry: GeoJSON.Geometry | null = null

    // Parse geometry string if exists (format: "lat,lon;lat,lon")
    if (mapping.geometry && row[mapping.geometry]) {
      try {
        const geometryValue = String(row[mapping.geometry])
        const points = geometryValue.split(';').map((p: string) => {
          const [lat, lon] = p.split(',').map(Number)
          if (!isNaN(lat) && !isNaN(lon)) return { lat, lon }
          return null
        }).filter((p): p is { lat: number; lon: number } => p !== null)

        if (points.length > 0) {
          const type = mapping.type ? row[mapping.type] : 'point'
          if (type === 'polygon' || type === 'area' || type === 'alan') {
            geometry = { type: 'Polygon', coordinates: [points.map((p) => [p.lon, p.lat])] }
          } else if (type === 'line' || type === 'route' || type === 'rota') {
            geometry = { type: 'LineString', coordinates: points.map((p) => [p.lon, p.lat]) }
          } else {
            const firstPoint = points[0]
            if (firstPoint) {
              geometry = { type: 'Point', coordinates: [firstPoint.lon, firstPoint.lat] }
            }
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
      name: mapping.name ? String(row[mapping.name] ?? '') : `Item ${index + 1}`,
      type: String(mapping.type ? row[mapping.type] : 'point')
        ?.toLowerCase()
        ?.replace('rota', 'line')
        .replace('alan', 'polygon') || 'point',
      geometry: geometry,
      properties: row,
      visible: true,
      date: extractDateFromProperties(row),
    } as GeoItem
  }).filter(Boolean) as GeoItem[]
}
