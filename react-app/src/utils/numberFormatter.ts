/**
 * Number Formatting Utilities
 */

export type NumberFormat =
  | '1,000'       // 1,234
  | '1,000.0'     // 1,234.5
  | '1,000.00'    // 1,234.56
  | '1,000.000'   // 1,234.567
  | '0'           // 1234
  | '0.0'         // 1234.5
  | '0.00'        // 1234.56
  | '0.000'       // 1234.567
  | '0.[0]'       // 1234 or 1234.5
  | '0.[00]'      // 1234 or 1234.56
  | '0%'          // 12%
  | '0.0%'        // 12.3%
  | '0.00%'       // 12.34%
  | '0,0'         // 1,234 (always with separator)
  | '0o'          // 1st, 2nd, 3rd
  | '0a'          // 1k, 123k, 1.2m
  | '0.[0]a'      // 1k, 123.4k, 1.2m
  | 'custom'      // Custom format

const NUMBER_FORMAT_VALUES: NumberFormat[] = [
  '1,000',
  '1,000.0',
  '1,000.00',
  '1,000.000',
  '0',
  '0.0',
  '0.00',
  '0.000',
  '0.[0]',
  '0.[00]',
  '0%',
  '0.0%',
  '0.00%',
  '0,0',
  '0o',
  '0a',
  '0.[0]a',
  'custom',
]

const NUMBER_FORMAT_SET = new Set<NumberFormat>(NUMBER_FORMAT_VALUES)

export function isNumberFormat(format: string): format is NumberFormat {
  return NUMBER_FORMAT_SET.has(format as NumberFormat)
}

export function coerceNumberFormat(format: string | null | undefined, fallback: NumberFormat = '0a'): NumberFormat {
  if (format && isNumberFormat(format)) {
    return format
  }
  return fallback
}

/**
 * Format a number according to specified format
 */
export function formatNumber(value: number, format: NumberFormat): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  switch (format) {
    case '1,000':
      return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })

    case '1,000.0':
      return value.toLocaleString('tr-TR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })

    case '1,000.00':
      return value.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

    case '1,000.000':
      return value.toLocaleString('tr-TR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })

    case '0':
      return Math.round(value).toString()

    case '0.0':
      return value.toFixed(1)

    case '0.00':
      return value.toFixed(2)

    case '0.000':
      return value.toFixed(3)

    case '0.[0]':
      return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)

    case '0.[00]':
      return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)

    case '0%':
      return `${Math.round(value * 100)}%`

    case '0.0%':
      return `${(value * 100).toFixed(1)}%`

    case '0.00%':
      return `${(value * 100).toFixed(2)}%`

    case '0,0':
      return value.toLocaleString('tr-TR')

    case '0o':
      return getOrdinal(Math.round(value))

    case '0a':
      return abbreviateNumber(value, 0)

    case '0.[0]a':
      return abbreviateNumber(value, 1)

    default:
      return value.toString()
  }
}

/**
 * Convert number to ordinal (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  // Turkish ordinal logic is different, simplified version
  return `${n}.`
}

/**
 * Abbreviate large numbers (1k, 1.2m, etc.)
 */
function abbreviateNumber(value: number, decimals: number): string {
  if (value === 0) return '0'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  const abbrev = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'k' },
  ]

  for (const { threshold, suffix } of abbrev) {
    if (absValue >= threshold) {
      const abbreviated = absValue / threshold
      const formatted = decimals > 0
        ? abbreviated.toFixed(decimals).replace(/\.0+$/, '')
        : Math.round(abbreviated).toString()

      return `${sign}${formatted}${suffix}`
    }
  }

  return decimals > 0
    ? value.toFixed(decimals).replace(/\.0+$/, '')
    : Math.round(value).toString()
}

/**
 * Format string for display in UI
 */
export const FORMAT_OPTIONS: Array<{
  value: NumberFormat;
  label: string;
  example: string;
}> = [
  { value: '1,000', label: '1.000', example: '1.234' },
  { value: '1,000.0', label: '1.000,0', example: '1.234,5' },
  { value: '1,000.00', label: '1.000,00', example: '1.234,56' },
  { value: '1,000.000', label: '1.000,000', example: '1.234,567' },
  { value: '0', label: '0', example: '1234' },
  { value: '0.0', label: '0.0', example: '1234.5' },
  { value: '0.00', label: '0.00', example: '1234.56' },
  { value: '0.000', label: '0.000', example: '1234.567' },
  { value: '0.[0]', label: '0.[0]', example: '1234 veya 1234.5' },
  { value: '0.[00]', label: '0.[00]', example: '1234 veya 1234.56' },
  { value: '0%', label: '0%', example: '12%' },
  { value: '0.0%', label: '0.0%', example: '12.3%' },
  { value: '0.00%', label: '0.00%', example: '12.34%' },
  { value: '0,0', label: '0,0', example: '1,234' },
  { value: '0a', label: '0a (kısa)', example: '1k, 123k' },
  { value: '0.[0]a', label: '0.[0]a (kısa)', example: '1k, 123.4k' },
]

/**
 * Parse formatted number back to numeric value
 */
export function parseFormattedNumber(str: string): number | null {
  if (!str || str === '-') return null

  // Handle abbreviated numbers
  const trimmed = str.trim()
  const abbrevMatch = trimmed.match(/^([\d.,]+)([kmbt])$/i)
  if (abbrevMatch) {
    let numericPart = abbrevMatch[1]
    if (numericPart.includes(',') && numericPart.includes('.')) {
      numericPart = numericPart.replace(/\./g, '').replace(',', '.')
    } else if (numericPart.includes(',')) {
      numericPart = numericPart.replace(',', '.')
    } else {
      const dotParts = numericPart.split('.')
      if (dotParts.length > 2 || (dotParts.length === 2 && dotParts[1].length === 3)) {
        numericPart = numericPart.replace(/\./g, '')
      }
    }

    const num = parseFloat(numericPart)
    const suffix = abbrevMatch[2].toLowerCase()
    const multipliers: Record<string, number> = {
      k: 1e3,
      m: 1e6,
      b: 1e9,
      t: 1e12,
    }
    return num * (multipliers[suffix] || 1)
  }

  // Remove Turkish thousand separators
  let cleaned = trimmed.replace(/\./g, '')

  // Replace Turkish decimal separator with English
  cleaned = cleaned.replace(/,/g, '.')

  // Handle percentage
  if (cleaned.endsWith('%')) {
    cleaned = cleaned.slice(0, -1)
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num / 100
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}
