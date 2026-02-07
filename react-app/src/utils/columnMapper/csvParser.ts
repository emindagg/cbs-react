/**
 * CSV Parser Module
 * Handles CSV file parsing with RFC 4180 compliance
 * Enhanced: auto-delimiter detection, robust number parsing
 */

import type { RawDataRow } from './types'

/**
 * Parse CSV - RFC 4180 compliant (supports quoted fields)
 * Auto-detects delimiter (comma, semicolon, tab)
 */
export function parseCSV(text: string): RawDataRow[] {
  const lines = text.trim().split(/\r?\n/)

  if (lines.length < 2) {
    throw new Error('CSV dosyası en az 2 satır içermelidir')
  }

  // Auto-detect delimiter from first line
  const delimiter = detectDelimiter(lines[0])

  // Get headers from first line
  const headers = parseCSVLine(lines[0], delimiter)
  const data: RawDataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    const values = parseCSVLine(line, delimiter)

    // If column count doesn't match
    if (values.length !== headers.length) {
      const hasData = values.some((v) => v !== '')
      if (!hasData) continue // Empty line, skip silently

      // Has data but wrong column count - warn and skip
      console.warn(
        `Row ${i + 1}: Column count mismatch (Expected: ${headers.length}, Found: ${values.length})`,
      )
      continue
    }

    const row: RawDataRow = {}
    headers.forEach((header, index) => {
      const value = values[index]
      const parsed = parseSmartNumber(value)
      row[header] = parsed !== null ? parsed : value
    })

    data.push(row)
  }

  return data
}

/**
 * Auto-detect CSV delimiter by counting occurrences in header line.
 * Supports: comma (,), semicolon (;), tab (\t)
 */
function detectDelimiter(headerLine: string): string {
  const candidates = [
    { char: ',', count: 0 },
    { char: ';', count: 0 },
    { char: '\t', count: 0 },
  ]

  // Count occurrences outside quotes
  let inQuotes = false
  for (const ch of headerLine) {
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes) {
      for (const c of candidates) {
        if (ch === c.char) c.count++
      }
    }
  }

  // Pick the delimiter with highest count (minimum 1)
  candidates.sort((a, b) => b.count - a.count)
  return candidates[0].count > 0 ? candidates[0].char : ','
}

/**
 * Parse CSV line (supports quoted fields)
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Handle escaped quotes ""
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++ // skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current.trim())

  return result
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
