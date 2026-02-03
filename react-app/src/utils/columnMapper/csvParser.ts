/**
 * CSV Parser Module
 * Handles CSV file parsing with RFC 4180 compliance
 */

import type { RawDataRow } from './types'

/**
 * Parse CSV - RFC 4180 compliant (supports quoted commas)
 */
export function parseCSV(text: string): RawDataRow[] {
  const lines = text.trim().split(/\r?\n/)

  if (lines.length < 2) {
    throw new Error('CSV dosyası en az 2 satır içermelidir')
  }

  // Get headers from first line
  const headers = parseCSVLine(lines[0])
  const data: RawDataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    const values = parseCSVLine(line)

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
      // Detect numeric values (clean thousand separator)
      const cleanValue = value.replace(/\./g, '').replace(',', '.')
      const numValue = Number(cleanValue)
      row[header] = isNaN(numValue) ? value : numValue
    })

    data.push(row)
  }

  return data
}

/**
 * Parse CSV line (supports quoted commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Quote - toggle quoted field
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      // Comma and not in quotes - new field
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
