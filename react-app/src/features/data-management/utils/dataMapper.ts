import type { ColumnMapping, NewDataItem } from '../types'
import { extractDateFromProperties } from './dateParser'

export function transformToGeoItems(jsonData: Record<string, unknown>[], mapping: ColumnMapping): NewDataItem[] {
  return jsonData.map((row, index) => {
    let geometry: GeoJSON.Geometry | null = null

    if (mapping.geometry && row[mapping.geometry]) {
      try {
        const geometryValue = String(row[mapping.geometry])
        const points = geometryValue.split(';').map((value) => {
          const [lat, lon] = value.split(',').map(Number)
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon }
          return null
        }).filter((point): point is { lat: number; lon: number } => point !== null)

        if (points.length > 0) {
          const typeValue = mapping.type ? row[mapping.type] : 'point'
          if (typeValue === 'polygon' || typeValue === 'area' || typeValue === 'alan') {
            geometry = { type: 'Polygon', coordinates: [points.map(point => [point.lon, point.lat])] }
          } else if (typeValue === 'line' || typeValue === 'route' || typeValue === 'rota') {
            geometry = { type: 'LineString', coordinates: points.map(point => [point.lon, point.lat]) }
          } else {
            const firstPoint = points[0]
            geometry = { type: 'Point', coordinates: [firstPoint.lon, firstPoint.lat] }
          }
        }
      } catch {
        geometry = null
      }
    }

    if (!geometry && mapping.lat && mapping.lon) {
      const lat = Number(row[mapping.lat])
      const lon = Number(row[mapping.lon])
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        geometry = { type: 'Point', coordinates: [lon, lat] }
      }
    }

    if (!geometry) return null

    const rawType = String(mapping.type ? row[mapping.type] : 'point')
      .toLowerCase()
      .replace('rota', 'line')
      .replace('alan', 'polygon')

    const normalizedType: NewDataItem['type'] =
      rawType === 'polygon' || rawType === 'line' ? rawType : 'point' // circle artık desteklenmiyor, fallback: point

    return {
      name: mapping.name ? String(row[mapping.name] ?? '') : `Item ${index + 1}`,
      type: normalizedType,
      geometry,
      properties: row,
      date: extractDateFromProperties(row),
    } satisfies NewDataItem
  }).filter(Boolean) as NewDataItem[]
}

