import * as XLSX from 'xlsx'

import type { ParseResult } from '../types'
import { detectColumns } from '../utils/columnDetector'
import { transformToGeoItems } from '../utils/dataMapper'

/**
 * Process Excel/CSV files
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

  if (jsonData.length === 0) {
    return { items: [] }
  }

  // Column Detection
  const headers = Object.keys(jsonData[0] as object)
  const mapping = detectColumns(headers)

  // Check if auto-detection failed for critical columns
  if (!mapping.lat || !mapping.lon) {
    return {
      needsMapping: true,
      data: jsonData,
      headers,
      mapping,
    }
  }

  // Transform data
  const items = transformToGeoItems(jsonData, mapping)

  return { items }
}
