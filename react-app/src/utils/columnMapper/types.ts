/**
 * Type definitions for Column Mapper utility
 */

import type { DistrictInfo, LocationInfo } from '../../types/geojson'

export type RawDataRow = Record<string, unknown>

export type ParsedExcelWarningCode =
  | 'LEADING_EMPTY_ROWS_SKIPPED'
  | 'TITLE_ROWS_SKIPPED'
  | 'EMPTY_COLUMNS_REMOVED'
  | 'DUPLICATE_HEADERS_RENAMED'
  | 'BLANK_HEADERS_FILLED'

export type ExcelParseErrorCode =
  | 'EMPTY_WORKBOOK'
  | 'EMPTY_SHEET'
  | 'NO_VISIBLE_DATA'
  | 'HEADER_NOT_FOUND'
  | 'NO_DATA_ROWS_AFTER_HEADER'
  | 'SHEET_TOO_LARGE'

export interface ParsedExcelWarning {
  code: ParsedExcelWarningCode
  message: string
  meta?: Record<string, unknown>
}

export interface ParsedExcelStats {
  mode: ExcelSelectionMode
  headerRowIndex: number
  dataStartRowIndex: number
  leadingEmptyRowsSkipped: number
  titleRowsSkipped: number
  emptyRowsRemoved: number
  emptyColumnsRemoved: number
  sourceRowCount: number
  outputRowCount: number
}

export interface FileInfo {
  rowCount: number
  columns: string[]
  preview: RawDataRow[]
  warnings?: ParsedExcelWarning[]
  stats?: ParsedExcelStats
}

export interface ParsedExcelResult {
  rows: RawDataRow[]
  columns: string[]
  preview: RawDataRow[]
  warnings: ParsedExcelWarning[]
  stats: ParsedExcelStats
}

export type ExcelSelectionMode = 'header-row' | 'no-header'

export interface ExcelSelectionPreview {
  previewRows: string[][]
  previewRowIndices: number[]
  firstNonEmptyRow: number
  lastNonEmptyRow: number
  suggestedHeaderRowIndex: number
  hasReliableHeaderSuggestion: boolean
}

export interface PendingExcelSelection {
  matrix: string[][]
  firstNonEmptyRow: number
  lastNonEmptyRow: number
  suggestedHeaderRowIndex: number
}

export type FileLoadResult =
  | { kind: 'ready'; fileInfo: FileInfo }
  | { kind: 'needs-header-selection'; pending: PendingExcelSelection & { preview: ExcelSelectionPreview } }

export interface ExcelWorkerInput {
  buffer: ArrayBuffer
}

export type ExcelWorkerOutput =
  | { success: true; result: PendingExcelSelection & { preview: ExcelSelectionPreview } }
  | {
    success: false
    error: {
      code?: ExcelParseErrorCode
      message: string
      meta?: Record<string, unknown>
    }
  }

export class ExcelParseError extends Error {
  code: ExcelParseErrorCode
  meta?: Record<string, unknown>

  constructor(code: ExcelParseErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message)
    this.name = 'ExcelParseError'
    this.code = code
    this.meta = meta
  }
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
