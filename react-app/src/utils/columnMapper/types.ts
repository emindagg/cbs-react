/**
 * Type definitions for Column Mapper utility
 */

import type { DistrictInfo, LocationInfo } from '../../types/geojson'

export type RawDataRow = Record<string, unknown>

export interface FileInfo {
  rowCount: number
  columns: string[]
  preview: RawDataRow[]
}

export interface ColumnDetectionResult {
  locationColumn: string | null
  districtColumn: string | null
  dataColumn: string | null
  locationLevel: 'province' | 'district' | 'mixed' | 'auto'
}

export interface ColumnMapperIndexes {
  provinceIndex: Record<string, LocationInfo> | null
  districtIndex: Record<string, DistrictInfo[]> | null
}
