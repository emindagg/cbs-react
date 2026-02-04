/**
 * Data Matcher Module
 * Handles matching raw data with GeoJSON features
 */

import type { ColumnMapping, MatchResult, MatchResults } from '../../types/visualization'
import { normalizeTurkishText } from '../turkishNormalizer'
import type { ColumnMapperIndexes, RawDataRow } from './types'

/**
 * Match data with province/district GeoJSON
 */
export function matchData(
  rawData: RawDataRow[],
  columnMapping: ColumnMapping,
  indexes: ColumnMapperIndexes,
): MatchResults {
  if (!columnMapping.locationColumn || !columnMapping.dataColumn) {
    throw new Error('Veri veya sütun eşleştirmesi eksik')
  }

  const results: MatchResults = {
    successful: [],
    ambiguous: [],
    failed: [],
  }

  rawData.forEach((row, index) => {
    const locationValue = row[columnMapping.locationColumn!]
    const districtValue = columnMapping.districtColumn
      ? row[columnMapping.districtColumn]
      : null
    const dataValue = parseFloat(String(row[columnMapping.dataColumn!]))

    // Create match result
    const result: MatchResult = {
      rowIndex: index + 1,
      matched: false,
      ambiguous: false,
      originalData: row,
      value: dataValue,
    }

    if (!locationValue || isNaN(dataValue)) {
      result.error = 'Konum veya veri değeri eksik'
      results.failed.push(result)
      return
    }

    // Normalize location name
    const normalizedLocation = normalizeTurkishText(String(locationValue))

    // Province level matching
    if (columnMapping.locationLevel === 'province') {
      matchProvince(result, normalizedLocation, locationValue, indexes, results)
    }
    // District level matching
    else if (columnMapping.locationLevel === 'district') {
      matchDistrict(result, normalizedLocation, locationValue, indexes, results)
    }
    // Mixed level matching
    else if (columnMapping.locationLevel === 'mixed') {
      matchMixed(result, row, columnMapping, districtValue, indexes, results)
    }
  })

  console.debug(
    `📊 Match results: ${results.successful.length} successful, ${results.ambiguous.length} ambiguous, ${results.failed.length} failed`,
  )

  return results
}

/**
 * Match province level data
 */
function matchProvince(
  result: MatchResult,
  normalizedLocation: string,
  locationValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
): void {
  if (!indexes.provinceIndex) {
    result.error = 'İl indeksi yüklenmedi'
    results.failed.push(result)
    return
  }

  const provinceData = indexes.provinceIndex[normalizedLocation]
  if (provinceData) {
    result.matched = true
    result.province = provinceData.name
    result.location = provinceData.name
    results.successful.push(result)
  } else {
    result.error = `İl bulunamadı: ${String(locationValue)}`
    results.failed.push(result)
  }
}

/**
 * Match district level data
 */
function matchDistrict(
  result: MatchResult,
  normalizedLocation: string,
  locationValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
): void {
  if (!indexes.districtIndex) {
    result.error = 'İlçe indeksi yüklenmedi'
    results.failed.push(result)
    return
  }

  const districtMatches = indexes.districtIndex[normalizedLocation]
  if (districtMatches && districtMatches.length > 0) {
    if (districtMatches.length === 1) {
      // Unique match
      result.matched = true
      result.province = districtMatches[0].province
      result.district = districtMatches[0].name
      result.location = districtMatches[0].name
      results.successful.push(result)
    } else {
      // Ambiguous - multiple districts with same name
      result.ambiguous = true
      result.ambiguousOptions = districtMatches.map(d => ({
        name: d.name,
        province: d.province,
        properties: d.properties as Record<string, unknown>,
        geometry: d.geometry as unknown as Record<string, unknown>,
      }))
      result.location = String(locationValue)
      results.ambiguous.push(result)
    }
  } else {
    result.error = `İlçe bulunamadı: ${String(locationValue)}`
    results.failed.push(result)
  }
}

/**
 * Match mixed level data (province + district)
 */
function matchMixed(
  result: MatchResult,
  row: RawDataRow,
  columnMapping: ColumnMapping,
  districtValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
): void {
  if (!indexes.provinceIndex || !indexes.districtIndex) {
    result.error = 'İl/İlçe indeksleri yüklenmedi'
    results.failed.push(result)
    return
  }

  const normalizedProvince = columnMapping.locationColumn
    ? normalizeTurkishText(String(row[columnMapping.locationColumn]))
    : ''
  const normalizedDistrict = districtValue
    ? normalizeTurkishText(String(districtValue))
    : ''

  // Create composite key
  const compositeKey = `${normalizedProvince}_${normalizedDistrict}`

  // Try to find in district index
  const districtMatches = indexes.districtIndex[normalizedDistrict]
  if (districtMatches && districtMatches.length > 0) {
    // Find exact match with province
    const exactMatch = districtMatches.find((d) => d.compositeKey === compositeKey)
    if (exactMatch) {
      result.matched = true
      result.province = exactMatch.province
      result.district = exactMatch.name
      result.location = exactMatch.name
      // Store province in original data for later use
      result.originalData._province = exactMatch.province
      results.successful.push(result)
    } else {
      // Ambiguous - district found but province mismatch
      result.ambiguous = true
      result.ambiguousOptions = districtMatches.map(d => ({
        name: d.name,
        province: d.province,
        properties: d.properties as Record<string, unknown>,
        geometry: d.geometry as unknown as Record<string, unknown>,
      }))
      result.location = String(districtValue)
      results.ambiguous.push(result)
    }
  } else {
    result.error = `İlçe bulunamadı: ${String(districtValue)}`
    results.failed.push(result)
  }
}
