import { COLUMN_PATTERNS } from '../constants/formats'
import type { ColumnMapping } from '../types'

/**
 * Auto-detect column mappings from Excel/CSV headers
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}

  headers.forEach(header => {
    const lower = header.toLowerCase()

    for (const [key, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (patterns.some(pattern => lower.includes(pattern))) {
        mapping[key as keyof ColumnMapping] = header
        break
      }
    }
  })

  return mapping
}
