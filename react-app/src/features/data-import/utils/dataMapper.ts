import { extractDateFromProperties } from '@/utils/dateParser'
import { geometryTypeToItemType, parseGeometryString } from '@/utils/geometryParser'

import type { ColumnMapping, GeoItem } from '../types'

export function transformToGeoItems(jsonData: Record<string, unknown>[], mapping: ColumnMapping): GeoItem[] {
  return jsonData.map((row: Record<string, unknown>, index: number) => {
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
      visible: true,
      date: extractDateFromProperties(row),
    } as GeoItem
  }).filter(Boolean) as GeoItem[]
}
