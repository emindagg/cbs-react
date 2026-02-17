/**
 * CSV Parser Module
 * Uses PapaParse for RFC 4180 compliant parsing with auto-delimiter detection
 * Enhanced: robust Turkish/European number parsing via parseSmartNumber
 */

import Papa from 'papaparse'

import type { RawDataRow } from './types'

/**
 * Parse CSV - RFC 4180 compliant (supports quoted fields)
 * Auto-detects delimiter (comma, semicolon, tab) via PapaParse
 */
export function parseCSV(text: string): RawDataRow[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // parseSmartNumber handles number parsing
  })

  if (result.data.length === 0) {
    throw new Error('CSV dosyası en az 2 satır içermelidir')
  }

  return result.data.map(row => {
    const out: RawDataRow = {}
    for (const [key, value] of Object.entries(row)) {
      const parsed = parseSmartNumber(String(value ?? ''))
      out[key] = parsed !== null ? parsed : value
    }
    return out
  })
}

/**
 * Smart number parser — handles Turkish/European/US formats
 *
 * Supported formats:
 *  - "1234"          → 1234
 *  - "1.234"         → 1234        (Turkish thousand sep)
 *  - "1.234,56"      → 1234.56     (Turkish full)
 *  - "1,234.56"      → 1234.56     (US full)
 *  - "1 234 567"     → 1234567     (space thousand sep)
 *  - "%12.5" / "12.5%" → 0.125     (percentage)
 *  - "₺1.234,56"     → 1234.56    (currency)
 *  - "(1234)"        → -1234       (accounting negative)
 *  - "-1.234"        → -1234       (negative)
 *
 * Returns null if not a valid number.
 */
function parseSmartNumber(value: string): number | null {
  if (!value || value.trim() === '') return null

  let cleaned = value.trim()

  // Remove currency symbols and text
  cleaned = cleaned.replace(/[₺$€£]/g, '').replace(/\bTL\b/gi, '').trim()

  // Handle percentage (before or after)
  const isPercent = cleaned.startsWith('%') || cleaned.endsWith('%')
  cleaned = cleaned.replace(/%/g, '').trim()

  // Remove spaces (thousand separator: "1 234 567")
  cleaned = cleaned.replace(/\s/g, '')

  // Handle accounting negatives: "(1234)" → "-1234"
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }

  // Skip if remaining string is empty or clearly not numeric
  if (!cleaned || /[a-zA-ZçğıöşüÇĞİÖŞÜ]{2,}/.test(cleaned)) return null

  // Determine decimal/thousand separator format:
  // Count dots and commas
  const dots = (cleaned.match(/\./g) || []).length
  const commas = (cleaned.match(/,/g) || []).length

  if (dots > 0 && commas > 0) {
    // Both present: last one is decimal separator
    const lastDot = cleaned.lastIndexOf('.')
    const lastComma = cleaned.lastIndexOf(',')

    if (lastComma > lastDot) {
      // Turkish/European: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // US: 1,234.56
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (commas === 1 && dots === 0) {
    // Single comma: likely decimal (e.g. "12,5")
    cleaned = cleaned.replace(',', '.')
  } else if (dots === 1 && commas === 0) {
    // Single dot: could be decimal (12.5) or thousand (1.000)
    // If exactly 3 digits after dot and no digits before or >1 digit before, it's thousand sep
    const afterDot = cleaned.split('.')[1]
    const beforeDot = cleaned.replace('-', '').split('.')[0]
    if (afterDot && afterDot.length === 3 && beforeDot.length >= 1 && beforeDot.length <= 3 && /^\d+$/.test(afterDot)) {
      // Likely Turkish thousand: "1.234" or "12.345"
      // But "1.5" or "12.34" is decimal
      // Heuristic: if afterDot is exactly 3 digits AND value > 999, treat as thousand
      cleaned = cleaned.replace('.', '')
    }
    // else keep as decimal
  } else if (dots > 1) {
    // Multiple dots: thousand separators (e.g. "1.234.567")
    cleaned = cleaned.replace(/\./g, '')
  } else if (commas > 1) {
    // Multiple commas: thousand separators (e.g. "1,234,567")
    cleaned = cleaned.replace(/,/g, '')
  }

  const num = Number(cleaned)
  if (isNaN(num) || !isFinite(num)) return null

  return isPercent ? num / 100 : num
}
