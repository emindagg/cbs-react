import { geometryTypeToItemType, parseGeometryString } from '@/utils/geometryParser'

import type { ColumnMapping, NewDataItem } from '../types'
import { extractDateFromProperties } from './dateParser'

export function transformToGeoItems(jsonData: Record<string, unknown>[], mapping: ColumnMapping): NewDataItem[] {
  return jsonData.map((row, index) => {
    let geometry: GeoJSON.Geometry | null = null

    if (mapping.geometry && row[mapping.geometry]) {
      const typeHint = mapping.type ? String(row[mapping.type] ?? '') : undefined
      geometry = parseGeometryString(String(row[mapping.geometry]), typeHint)
    }

    if (!geometry && mapping.lat && mapping.lon) {
      const lat = Number(row[mapping.lat])
      const lon = Number(row[mapping.lon])
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        geometry = { type: 'Point', coordinates: [lon, lat] }
      }
    }

    if (!geometry) return null

    const itemType = geometry
      ? geometryTypeToItemType(geometry.type)
      : 'point'

    return {
      name: mapping.name ? String(row[mapping.name] ?? '') : `Item ${index + 1}`,
      type: itemType,
      geometry,
      properties: row,
      date: extractDateFromProperties(row),
    } satisfies NewDataItem
  }).filter(Boolean) as NewDataItem[]
}
