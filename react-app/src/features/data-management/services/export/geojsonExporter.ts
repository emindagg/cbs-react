import { buildGeoJSONBlob } from '@/utils/geojsonExport'
import type { GeoJSONExportOptions } from '@/utils/geojsonExport'

import type { DataItem } from '../../types'

export type { GeoJSONExportOptions }

export function exportAsGeoJSON(items: DataItem[], opts?: GeoJSONExportOptions): Blob {
  return buildGeoJSONBlob(items, opts)
}
