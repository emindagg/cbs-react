/**
 * Column Detector Module
 * Smart column detection with keyword matching + content-based detection
 */

import { parseFormattedNumber } from '../numberFormatter'
import { normalizeTurkishText } from '../turkishNormalizer'
import type { ColumnDetectionResult, RawDataRow } from './types'

// ── Well-known Turkish province names (normalized) for content detection ──
const KNOWN_PROVINCES = new Set([
  'adana', 'adiyaman', 'afyonkarahisar', 'agri', 'amasya', 'ankara', 'antalya',
  'artvin', 'aydin', 'balikesir', 'bilecik', 'bingol', 'bitlis', 'bolu',
  'burdur', 'bursa', 'canakkale', 'cankiri', 'corum', 'denizli', 'diyarbakir',
  'edirne', 'elazig', 'erzincan', 'erzurum', 'eskisehir', 'gaziantep',
  'giresun', 'gumushane', 'hakkari', 'hatay', 'isparta', 'mersin', 'istanbul',
  'izmir', 'kars', 'kastamonu', 'kayseri', 'kirklareli', 'kirsehir', 'kocaeli',
  'konya', 'kutahya', 'malatya', 'manisa', 'kahramanmaras', 'mardin', 'mugla',
  'mus', 'nevsehir', 'nigde', 'ordu', 'rize', 'sakarya', 'samsun', 'siirt',
  'sinop', 'sivas', 'tekirdag', 'tokat', 'trabzon', 'tunceli', 'sanliurfa',
  'usak', 'van', 'yozgat', 'zonguldak', 'aksaray', 'bayburt', 'karaman',
  'kirikkale', 'batman', 'sirnak', 'bartin', 'ardahan', 'igdir', 'yalova',
  'karabuk', 'kilis', 'osmaniye', 'duzce',
])

// ── Province column keywords ─────────────────────────────────────
const PROVINCE_EXACT_KEYWORDS = [
  'il', 'İl', 'IL', 'Il',
  'şehir', 'Şehir', 'Sehir', 'sehir', 'SEHIR',
  'province', 'Province', 'PROVINCE',
  'city', 'City', 'CITY',
  'kent', 'Kent', 'KENT',
  'vilayet', 'Vilayet', 'VILAYET',
  'plaka', 'Plaka', 'PLAKA',
]

const PROVINCE_PARTIAL_KEYWORDS = [
  'il_adi', 'iladi', 'il adi', 'il_ad',
  'sehir', 'şehir', 'kent',
  'province', 'city', 'vilayet',
  'iller',
  'plaka', 'plaka_kodu', 'plakakodu', 'il_kodu', 'ilkodu', 'il_kod',
]

// ── District column keywords ─────────────────────────────────────
const DISTRICT_EXACT_KEYWORDS = [
  'ilçe', 'İlçe', 'Ilce', 'ilce', 'ILCE', 'İLÇE',
  'district', 'District', 'DISTRICT',
]

const DISTRICT_PARTIAL_KEYWORDS = [
  'ilçe', 'ilce', 'ilce_adi', 'ilceadi', 'ilce_ad',
  'district',
]

/**
 * Smart column detection - automatic suggestions
 * Uses keyword matching + content-based detection
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

  // ── PHASE 1: Exact keyword match ──────────────────────────────

  // Find district column
  for (const col of columns) {
    const trimmed = col.trim()
    const isDistrictExact = DISTRICT_EXACT_KEYWORDS.some(
      (kw) => trimmed === kw || trimmed.toLowerCase() === kw.toLowerCase(),
    )
    if (isDistrictExact) {
      suggestions.districtColumn = col
      break
    }
  }

  // Find province column
  for (const col of columns) {
    const trimmed = col.trim()
    if (col === suggestions.districtColumn) continue

    const isProvinceExact = PROVINCE_EXACT_KEYWORDS.some(
      (kw) => trimmed === kw || trimmed.toLowerCase() === kw.toLowerCase(),
    )
    if (isProvinceExact) {
      suggestions.locationColumn = col
      break
    }
  }

  // ── PHASE 2: Partial keyword match ────────────────────────────

  if (!suggestions.districtColumn) {
    for (const col of columns) {
      const normalized = col.toLowerCase().trim()
      if (DISTRICT_PARTIAL_KEYWORDS.some((kw) => normalized.includes(kw))) {
        suggestions.districtColumn = col
        break
      }
    }
  }

  if (!suggestions.locationColumn) {
    for (const col of columns) {
      const normalized = col.toLowerCase().trim()
      if (col === suggestions.districtColumn) continue

      const matchesProvince = PROVINCE_PARTIAL_KEYWORDS.some((kw) => normalized.includes(kw))
      // Exclude if it matches district keywords
      const matchesDistrict = DISTRICT_PARTIAL_KEYWORDS.some((kw) => normalized.includes(kw))

      if (matchesProvince && !matchesDistrict) {
        suggestions.locationColumn = col
        break
      }
    }
  }

  // ── PHASE 3: Content-based detection ──────────────────────────
  // If keywords didn't find a location column, check column VALUES
  // against known province names or plate codes (1-81)
  if (!suggestions.locationColumn) {
    const contentResult = detectLocationColumnByContent(rawData, columns, suggestions.districtColumn)
    if (contentResult) {
      suggestions.locationColumn = contentResult
    }
  }

  // ── PHASE 3b: Plate code content detection ──────────────────
  // If still no location column, check for plate codes (1-81)
  if (!suggestions.locationColumn) {
    const plateResult = detectPlateCodeColumn(rawData, columns, suggestions.districtColumn)
    if (plateResult) {
      suggestions.locationColumn = plateResult
    }
  }

  // ── PHASE 4: Data column detection ────────────────────────────
  const numericColumns = detectNumericColumns(rawData, columns)
  // Pick the first numeric column that isn't already used as location/district
  for (const numCol of numericColumns) {
    if (numCol !== suggestions.locationColumn && numCol !== suggestions.districtColumn) {
      suggestions.dataColumn = numCol
      break
    }
  }

  // ── PHASE 5: Location level detection ─────────────────────────
  if (suggestions.locationColumn && suggestions.districtColumn) {
    suggestions.locationLevel = 'mixed'
  } else if (suggestions.locationColumn) {
    suggestions.locationLevel = 'province'
  } else {
    // Last resort: use first non-numeric column
    const nonNumeric = columns.find((c) => !numericColumns.includes(c))
    suggestions.locationColumn = nonNumeric || columns[0]
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
 * Detect plate code column by checking if column values are numbers 1-81.
 * Samples first 10 rows and checks if >50% match valid plate codes.
 */
function detectPlateCodeColumn(
  rawData: RawDataRow[],
  columns: string[],
  skipColumn: string | null,
): string | null {
  const sampleSize = Math.min(10, rawData.length)
  const MATCH_THRESHOLD = 0.5

  let bestColumn: string | null = null
  let bestScore = 0

  for (const col of columns) {
    if (col === skipColumn) continue

    let matchCount = 0
    let totalCount = 0

    for (let i = 0; i < sampleSize; i++) {
      const value = rawData[i][col]
      if (value === null || value === undefined || value === '') continue

      totalCount++
      const num = typeof value === 'number' ? value : parseInt(String(value), 10)
      if (!isNaN(num) && num >= 1 && num <= 81) {
        matchCount++
      }
    }

    if (totalCount > 0) {
      const score = matchCount / totalCount
      if (score > bestScore && score >= MATCH_THRESHOLD) {
        bestScore = score
        bestColumn = col
      }
    }
  }

  return bestColumn
}

/**
 * Detect location column by checking if column values are known province names.
 * Samples first 10 rows and checks if >50% match known provinces.
 */
function detectLocationColumnByContent(
  rawData: RawDataRow[],
  columns: string[],
  skipColumn: string | null,
): string | null {
  const sampleSize = Math.min(10, rawData.length)
  const MATCH_THRESHOLD = 0.5

  let bestColumn: string | null = null
  let bestScore = 0

  for (const col of columns) {
    if (col === skipColumn) continue

    let matchCount = 0
    let totalCount = 0

    for (let i = 0; i < sampleSize; i++) {
      const value = rawData[i][col]
      if (value === null || value === undefined || value === '') continue

      const strValue = String(value)
      // Skip if it looks numeric
      if (!isNaN(Number(strValue))) continue

      totalCount++
      const normalized = normalizeTurkishText(strValue)
      if (KNOWN_PROVINCES.has(normalized)) {
        matchCount++
      }
    }

    if (totalCount > 0) {
      const score = matchCount / totalCount
      if (score > bestScore && score >= MATCH_THRESHOLD) {
        bestScore = score
        bestColumn = col
      }
    }
  }

  return bestColumn
}

/**
 * Detect numeric columns
 * Uses parseFormattedNumber which handles tr/en thousand+decimal separators,
 * currency symbols, percentages and abbreviations.
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
      if (value === null || value === undefined || value === '') continue
      totalCount++
      if (typeof value === 'number') {
        numericCount++
      } else if (parseFormattedNumber(String(value)) !== null) {
        numericCount++
      }
    }

    if (totalCount > 0 && numericCount / totalCount > NUMERIC_THRESHOLD) {
      numericColumns.push(col)
    }
  }

  return numericColumns
}
