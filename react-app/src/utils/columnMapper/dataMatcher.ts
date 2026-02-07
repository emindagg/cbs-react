/**
 * Data Matcher Module
 * Handles matching raw data with GeoJSON features
 * Enhanced: fuzzy fallback with Levenshtein distance + "did you mean?" suggestions
 */

import type { ColumnMapping, MatchResult, MatchResults } from '../../types/visualization'
import { findClosestMatch, normalizeTurkishText } from '../turkishNormalizer'
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

  // Pre-compute known keys for fuzzy matching
  const provinceKeys = indexes.provinceIndex ? Object.keys(indexes.provinceIndex) : []
  const districtKeys = indexes.districtIndex ? Object.keys(indexes.districtIndex) : []

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
      result.location = String(locationValue || '')
      result.error = 'Konum veya veri değeri eksik'
      results.failed.push(result)
      return
    }

    // Normalize location name
    const normalizedLocation = normalizeTurkishText(String(locationValue))

    // Province level matching
    if (columnMapping.locationLevel === 'province') {
      matchProvince(result, normalizedLocation, locationValue, indexes, results, provinceKeys)
    }
    // District level matching
    else if (columnMapping.locationLevel === 'district') {
      matchDistrict(result, normalizedLocation, locationValue, indexes, results, districtKeys)
    }
    // Mixed level matching
    else if (columnMapping.locationLevel === 'mixed') {
      matchMixed(result, row, columnMapping, districtValue, indexes, results, provinceKeys, districtKeys)
    }
  })

  console.debug(
    `📊 Match results: ${results.successful.length} successful, ${results.ambiguous.length} ambiguous, ${results.failed.length} failed`,
  )

  return results
}

/**
 * Match province level data — exact first, then fuzzy fallback
 */
function matchProvince(
  result: MatchResult,
  normalizedLocation: string,
  locationValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
  provinceKeys: string[],
): void {
  if (!indexes.provinceIndex) {
    result.location = String(locationValue)
    result.error = 'İl indeksi yüklenmedi'
    results.failed.push(result)
    return
  }

  // ── Exact match ──
  const provinceData = indexes.provinceIndex[normalizedLocation]
  if (provinceData) {
    result.matched = true
    result.province = provinceData.name
    result.location = provinceData.name
    results.successful.push(result)
    return
  }

  // ── Fuzzy fallback ──
  const fuzzy = findClosestMatch(normalizedLocation, provinceKeys)
  if (fuzzy && fuzzy.distance <= 2) {
    const fuzzyData = indexes.provinceIndex[fuzzy.key]
    if (fuzzyData) {
      result.matched = true
      result.province = fuzzyData.name
      result.location = fuzzyData.name
      results.successful.push(result)
      return
    }
  }

  // ── Failed with suggestion ──
  result.location = String(locationValue)
  if (fuzzy) {
    const suggestedName = indexes.provinceIndex[fuzzy.key]?.name || fuzzy.key
    result.error = `İl bulunamadı: "${String(locationValue)}" — Bunu mu demek istediniz: "${suggestedName}"?`
  } else {
    result.error = `İl bulunamadı: ${String(locationValue)}`
  }
  results.failed.push(result)
}

/**
 * Match district level data — exact first, then fuzzy fallback
 */
function matchDistrict(
  result: MatchResult,
  normalizedLocation: string,
  locationValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
  districtKeys: string[],
): void {
  if (!indexes.districtIndex) {
    result.location = String(locationValue)
    result.error = 'İlçe indeksi yüklenmedi'
    results.failed.push(result)
    return
  }

  // ── Exact match ──
  const districtMatches = indexes.districtIndex[normalizedLocation]
  if (districtMatches && districtMatches.length > 0) {
    if (districtMatches.length === 1) {
      result.matched = true
      result.province = districtMatches[0].province
      result.district = districtMatches[0].name
      result.location = districtMatches[0].name
      results.successful.push(result)
    } else {
      result.ambiguous = true
      result.ambiguousOptions = districtMatches.map((d) => ({
        name: d.name,
        province: d.province,
        properties: d.properties as Record<string, unknown>,
        geometry: d.geometry as unknown as Record<string, unknown>,
      }))
      result.location = String(locationValue)
      results.ambiguous.push(result)
    }
    return
  }

  // ── Fuzzy fallback ──
  const fuzzy = findClosestMatch(normalizedLocation, districtKeys)
  if (fuzzy && fuzzy.distance <= 2) {
    const fuzzyMatches = indexes.districtIndex[fuzzy.key]
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      if (fuzzyMatches.length === 1) {
        result.matched = true
        result.province = fuzzyMatches[0].province
        result.district = fuzzyMatches[0].name
        result.location = fuzzyMatches[0].name
        results.successful.push(result)
      } else {
        result.ambiguous = true
        result.ambiguousOptions = fuzzyMatches.map((d) => ({
          name: d.name,
          province: d.province,
          properties: d.properties as Record<string, unknown>,
          geometry: d.geometry as unknown as Record<string, unknown>,
        }))
        result.location = String(locationValue)
        results.ambiguous.push(result)
      }
      return
    }
  }

  // ── Failed with suggestion ──
  result.location = String(locationValue)
  if (fuzzy) {
    const suggestedMatches = indexes.districtIndex[fuzzy.key]
    const suggestedName = suggestedMatches?.[0]?.name || fuzzy.key
    result.error = `İlçe bulunamadı: "${String(locationValue)}" — Bunu mu demek istediniz: "${suggestedName}"?`
  } else {
    result.error = `İlçe bulunamadı: ${String(locationValue)}`
  }
  results.failed.push(result)
}

/**
 * Match mixed level data (province + district) — exact first, then fuzzy fallback
 */
function matchMixed(
  result: MatchResult,
  row: RawDataRow,
  columnMapping: ColumnMapping,
  districtValue: unknown,
  indexes: ColumnMapperIndexes,
  results: MatchResults,
  provinceKeys: string[],
  districtKeys: string[],
): void {
  if (!indexes.provinceIndex || !indexes.districtIndex) {
    result.location = String(districtValue || (columnMapping.locationColumn ? row[columnMapping.locationColumn] : ''))
    result.error = 'İl/İlçe indeksleri yüklenmedi'
    results.failed.push(result)
    return
  }

  let normalizedProvince = columnMapping.locationColumn
    ? normalizeTurkishText(String(row[columnMapping.locationColumn]))
    : ''
  let normalizedDistrict = districtValue
    ? normalizeTurkishText(String(districtValue))
    : ''

  // ── Fuzzy correct province if not found ──
  if (normalizedProvince && !indexes.provinceIndex[normalizedProvince]) {
    const fuzzyProv = findClosestMatch(normalizedProvince, provinceKeys)
    if (fuzzyProv && fuzzyProv.distance <= 2) {
      normalizedProvince = fuzzyProv.key
    }
  }

  // ── Fuzzy correct district if not found ──
  if (normalizedDistrict && !indexes.districtIndex[normalizedDistrict]) {
    const fuzzyDist = findClosestMatch(normalizedDistrict, districtKeys)
    if (fuzzyDist && fuzzyDist.distance <= 2) {
      normalizedDistrict = fuzzyDist.key
    }
  }

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
      result.originalData._province = exactMatch.province
      results.successful.push(result)
    } else {
      // Ambiguous - district found but province mismatch
      result.ambiguous = true
      result.ambiguousOptions = districtMatches.map((d) => ({
        name: d.name,
        province: d.province,
        properties: d.properties as Record<string, unknown>,
        geometry: d.geometry as unknown as Record<string, unknown>,
      }))
      result.location = String(districtValue)
      results.ambiguous.push(result)
    }
  } else {
    result.location = String(districtValue)
    // Provide suggestion
    const fuzzy = findClosestMatch(normalizedDistrict, districtKeys)
    if (fuzzy) {
      const suggestedMatches = indexes.districtIndex[fuzzy.key]
      const suggestedName = suggestedMatches?.[0]?.name || fuzzy.key
      result.error = `İlçe bulunamadı: "${String(districtValue)}" — Bunu mu demek istediniz: "${suggestedName}"?`
    } else {
      result.error = `İlçe bulunamadı: ${String(districtValue)}`
    }
    results.failed.push(result)
  }
}
