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

export function coerceNumberFormat(format: string | null | undefined, fallback: NumberFormat = '1,000'): NumberFormat {
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
    { threshold: 1e9, suffix: 'Mlr' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'B' },
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
  { value: '0a', label: '0a (kısa)', example: '1B, 123B, 1M' },
  { value: '0.[0]a', label: '0.[0]a (kısa)', example: '1B, 123.4B, 1.2M' },
]

/**
 * Bir sütunun ondalık/binlik ayıraç yerelini tespit eder.
 *
 * Heuristikler (öncelik sırasıyla):
 *  1. Hem nokta hem virgül varsa: sondaki karakter ondalıktır.
 *  2. İki veya daha fazla aynı ayırıcı varsa kesinlikle binlik grubudur.
 *  3. Tek ayırıcı + 3 haneli son grup → binlik olma olasılığı yüksek.
 *  4. Tek ayırıcı + 3 olmayan son grup → ondalık; virgül TR, nokta belirsiz.
 *
 * 'ambiguous': Yeterli kanıt yok; parseFormattedNumber heuristiği devreye girer.
 */
export type NumberLocale = 'tr' | 'en' | 'ambiguous'

export interface ColumnLocaleReport {
  locale: NumberLocale
  trScore: number
  enScore: number
  samples: number
  /** Aynı sütunda çelişkili güçlü kanıt oranı (0-1). */
  inconsistency: number
}

export function detectNumberLocale(values: readonly unknown[]): ColumnLocaleReport {
  let trScore = 0
  let enScore = 0
  let samples = 0
  let trStrong = 0
  let enStrong = 0

  for (const raw of values) {
    if (raw === null || raw === undefined) continue
    if (typeof raw === 'number') continue
    const s = String(raw).trim()
    if (!s) continue

    const digitOnly = s.replace(/[^\d.,]/g, '')
    if (!digitOnly) continue

    samples++

    const dotCount = (digitOnly.match(/\./g) || []).length
    const commaCount = (digitOnly.match(/,/g) || []).length

    if (dotCount >= 1 && commaCount >= 1) {
      const lastDot = digitOnly.lastIndexOf('.')
      const lastComma = digitOnly.lastIndexOf(',')
      if (lastComma > lastDot) { trScore += 5; trStrong++ }
      else { enScore += 5; enStrong++ }
      continue
    }

    if (dotCount >= 2 && commaCount === 0) { trScore += 5; trStrong++; continue }
    if (commaCount >= 2 && dotCount === 0) { enScore += 5; enStrong++; continue }

    if (dotCount === 1 && commaCount === 0) {
      const frac = digitOnly.split('.')[1] ?? ''
      if (frac.length === 3) trScore += 1
      else enScore += 2 // 12.5 → en ondalık güçlü
      continue
    }
    if (commaCount === 1 && dotCount === 0) {
      const frac = digitOnly.split(',')[1] ?? ''
      if (frac.length === 3) enScore += 1
      else trScore += 2 // 12,5 → tr ondalık güçlü
      continue
    }
  }

  const strongTotal = trStrong + enStrong
  const inconsistency = strongTotal > 1
    ? Math.min(trStrong, enStrong) / strongTotal
    : 0

  let locale: NumberLocale
  if (samples === 0 || trScore === enScore) locale = 'ambiguous'
  else locale = trScore > enScore ? 'tr' : 'en'

  return { locale, trScore, enScore, samples, inconsistency }
}

/** Locale zorunlu: her çağrı aynı ayıraç kuralıyla parse edilir. */
export function parseWithLocale(str: string, locale: NumberLocale): number | null {
  if (!str) return null
  const trimmed = str.trim()
  if (!trimmed || trimmed === '-') return null

  const abbrevMatch = trimmed.match(/^([\d.,]+)(Mlr|[kmbtBM])$/i)
  if (abbrevMatch) {
    const num = parseLocaleNumeric(abbrevMatch[1], locale)
    if (num === null) return null
    const suffix = abbrevMatch[2].toLowerCase()
    const multipliers: Record<string, number> = { k: 1e3, b: 1e3, m: 1e6, mlr: 1e9, t: 1e12 }
    return num * (multipliers[suffix] || 1)
  }

  if (trimmed.endsWith('%')) {
    const num = parseLocaleNumeric(trimmed.slice(0, -1), locale)
    return num === null ? null : num / 100
  }

  return parseLocaleNumeric(trimmed, locale)
}

function parseLocaleNumeric(s: string, locale: NumberLocale): number | null {
  const compact = s.replace(/\s+/g, '').replace(/[^\d.,+-]/g, '')
  if (!compact) return null

  if (locale === 'ambiguous') {
    return parseFormattedNumber(compact)
  }

  const normalized = locale === 'tr'
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact.replace(/,/g, '')

  const num = Number.parseFloat(normalized)
  return Number.isNaN(num) ? null : num
}

/**
 * Bir veri setinin tek sütununu sayıya çevirir.
 * Sütunun locale'ı tek seferde tespit edilir; tüm satırlar aynı kuralla parse edilir.
 * Orijinal kayıtlar mutate edilmez.
 */
export function coerceNumericColumn(
  data: readonly Record<string, unknown>[],
  column: string,
): { data: Record<string, unknown>[]; report: ColumnLocaleReport } {
  const values = data.map((row) => row[column])
  const report = detectNumberLocale(values)

  const next = data.map((row) => {
    const raw = row[column]
    if (typeof raw === 'number') return row
    if (raw === null || raw === undefined || raw === '') return row
    const parsed = parseWithLocale(String(raw), report.locale)
    if (parsed === null) return row
    return { ...row, [column]: parsed }
  })

  return { data: next, report }
}

/**
 * Parse formatted number back to numeric value
 */
export function parseFormattedNumber(str: string): number | null {
  if (!str || str === '-') return null

  const parseLocalizedNumeric = (value: string): number | null => {
    const compact = value.replace(/\s+/g, '').replace(/[^\d.,+-]/g, '')
    if (!compact) return null

    const hasComma = compact.includes(',')
    const hasDot = compact.includes('.')
    let normalized = compact

    if (hasComma && hasDot) {
      const lastComma = compact.lastIndexOf(',')
      const lastDot = compact.lastIndexOf('.')
      const decimalSep = lastComma > lastDot ? ',' : '.'
      const thousandSep = decimalSep === ',' ? '.' : ','
      normalized = compact.replace(new RegExp(`\\${thousandSep}`, 'g'), '')
      if (decimalSep === ',') normalized = normalized.replace(',', '.')
    } else if (hasComma) {
      const commaCount = (compact.match(/,/g) || []).length
      if (commaCount > 1) {
        normalized = compact.replace(/,/g, '')
      } else {
        const [, frac = ''] = compact.split(',')
        normalized = /^\d{3}$/.test(frac) ? compact.replace(/,/g, '') : compact.replace(',', '.')
      }
    } else if (hasDot) {
      const dotCount = (compact.match(/\./g) || []).length
      if (dotCount > 1) {
        normalized = compact.replace(/\./g, '')
      } else {
        const [, frac = ''] = compact.split('.')
        normalized = /^\d{3}$/.test(frac) ? compact.replace(/\./g, '') : compact
      }
    }

    const num = Number.parseFloat(normalized)
    return Number.isNaN(num) ? null : num
  }

  // Handle abbreviated numbers
  const trimmed = str.trim()
  const abbrevMatch = trimmed.match(/^([\d.,]+)(Mlr|[kmbtBM])$/i)
  if (abbrevMatch) {
    const num = parseLocalizedNumeric(abbrevMatch[1])
    if (num === null) return null
    const suffix = abbrevMatch[2].toLowerCase()
    const multipliers: Record<string, number> = {
      k: 1e3,
      b: 1e3,
      m: 1e6,
      mlr: 1e9,
      t: 1e12,
    }
    return num * (multipliers[suffix] || 1)
  }

  // Handle percentage
  if (trimmed.endsWith('%')) {
    const num = parseLocalizedNumeric(trimmed.slice(0, -1))
    return num === null ? null : num / 100
  }

  return parseLocalizedNumeric(trimmed)
}
