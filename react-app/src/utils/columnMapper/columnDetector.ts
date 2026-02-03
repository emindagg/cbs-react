/**
 * Column Detector Module
 * Smart column detection with keyword matching
 */

import type { ColumnDetectionResult, RawDataRow } from './types'

/**
 * Smart column detection - automatic suggestions
 */
export function detectColumns(
  rawData: RawDataRow[] | null,
  columns: string[],
): ColumnDetectionResult | null {
  if (!rawData || rawData.length === 0) {
    return null
  }

  const suggestions: ColumnDetectionResult = {
    locationColumn: null,
    districtColumn: null,
    dataColumn: null,
    locationLevel: 'auto',
  }

  const provinceKeywords = [
    { exact: ['il', 'İl', 'IL'], contains: [] },
    { exact: ['şehir', 'Şehir', 'Sehir', 'sehir'], contains: [] },
    { exact: ['province', 'Province', 'PROVINCE'], contains: [] },
    { exact: ['city', 'City', 'CITY'], contains: [] },
  ]

  const districtKeywords = [
    { exact: ['ilçe', 'İlçe', 'Ilce', 'ilce', 'ILCE'], contains: [] },
    { exact: ['district', 'District', 'DISTRICT'], contains: [] },
  ]

  // FIRST: Find exact match district column
  for (const col of columns) {
    const trimmed = col.trim()
    const normalized = trimmed.toLowerCase()

    const isDistrictExact = districtKeywords.some((group) =>
      group.exact.some((kw) => trimmed === kw || normalized === kw.toLowerCase()),
    )

    if (isDistrictExact) {
      suggestions.districtColumn = col
      break
    }
  }

  // SECOND: Find province column
  for (const col of columns) {
    const trimmed = col.trim()
    const normalized = trimmed.toLowerCase()

    // Skip if already marked as district
    if (col === suggestions.districtColumn) continue

    const isProvinceExact = provinceKeywords.some((group) =>
      group.exact.some((kw) => trimmed === kw || normalized === kw.toLowerCase()),
    )

    if (isProvinceExact && !suggestions.locationColumn) {
      suggestions.locationColumn = col
    }
  }

  // THIRD: Partial matching (if exact not found)
  if (!suggestions.districtColumn) {
    for (const col of columns) {
      const normalized = col.toLowerCase().trim()

      if (
        normalized.includes('ilçe') ||
                normalized.includes('ilce') ||
                normalized.includes('district')
      ) {
        suggestions.districtColumn = col
        break
      }
    }
  }

  if (!suggestions.locationColumn) {
    for (const col of columns) {
      const normalized = col.toLowerCase().trim()

      // Skip if already marked as district
      if (col === suggestions.districtColumn) continue

      if (
        (normalized.includes('il') ||
                    normalized.includes('şehir') ||
                    normalized.includes('sehir') ||
                    normalized.includes('province') ||
                    normalized.includes('city')) &&
                !normalized.includes('ilçe') &&
                !normalized.includes('ilce') &&
                !normalized.includes('district')
      ) {
        suggestions.locationColumn = col
        break
      }
    }
  }

  // Data column detection (numeric columns)
  const numericColumns = detectNumericColumns(rawData, columns)
  if (numericColumns.length > 0) {
    suggestions.dataColumn = numericColumns[0]
  }

  // Location level detection
  if (suggestions.locationColumn && suggestions.districtColumn) {
    suggestions.locationLevel = 'mixed'
  } else if (suggestions.locationColumn) {
    suggestions.locationLevel = 'province'
  } else {
    // Default to first column as location
    suggestions.locationColumn = columns[0]
    suggestions.locationLevel = 'auto'
  }

  console.debug('🔍 Auto column detection:')
  console.debug('  - Province column:', suggestions.locationColumn)
  console.debug('  - District column:', suggestions.districtColumn)
  console.debug('  - Data column:', suggestions.dataColumn)
  console.debug('  - Location level:', suggestions.locationLevel)

  return suggestions
}

/**
 * Detect numeric columns
 */
function detectNumericColumns(rawData: RawDataRow[], columns: string[]): string[] {
  if (!rawData || rawData.length === 0) {
    return []
  }

  const numericColumns: string[] = []
  const NUMERIC_THRESHOLD = 0.8

  for (const col of columns) {
    let numericCount = 0
    let totalCount = 0

    for (const row of rawData) {
      const value = row[col]
      if (value !== null && value !== undefined && value !== '') {
        totalCount++
        if (typeof value === 'number' || !isNaN(Number(value))) {
          numericCount++
        }
      }
    }

    // If >80% of values are numeric, consider it numeric column
    if (totalCount > 0 && numericCount / totalCount > NUMERIC_THRESHOLD) {
      numericColumns.push(col)
    }
  }

  return numericColumns
}
