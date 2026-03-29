import Papa from 'papaparse'

import type { ParseResult } from '../../types'
import { detectColumns } from '../../utils/columnDetector'
import { transformToGeoItems } from '../../utils/dataMapper'

export async function parseCsv(file: File): Promise<ParseResult> {
  const text = await file.text()

  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    delimiter: '',
    skipEmptyLines: true,
    dynamicTyping: true,
  })

  const jsonData = result.data
  if (jsonData.length === 0) {
    return { items: [] }
  }

  const headers = result.meta.fields ?? Object.keys(jsonData[0] as object)
  const mapping = detectColumns(headers)

  if ((!mapping.lat || !mapping.lon) && !mapping.geometry) {
    return {
      needsMapping: true,
      data: jsonData,
      headers,
      mapping,
    }
  }

  const items = transformToGeoItems(jsonData, mapping)
  return { items }
}
