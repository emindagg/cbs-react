import { describe, expect, it } from 'vitest'

import { coerceNumberFormat, formatNumber, parseFormattedNumber } from './numberFormatter'

describe('numberFormatter', () => {
  it('coerces unknown format to fallback', () => {
    expect(coerceNumberFormat('0a')).toBe('0a')
    expect(coerceNumberFormat('auto', '0a')).toBe('0a')
    expect(coerceNumberFormat(undefined, '0.00')).toBe('0.00')
  })

  it('formats abbreviations and percentages', () => {
    expect(formatNumber(1200, '0a')).toBe('1k')
    expect(formatNumber(1250, '0.[0]a')).toBe('1.3k')
    expect(formatNumber(0.1234, '0.0%')).toBe('12.3%')
  })

  it('parses localized and abbreviated values', () => {
    expect(parseFormattedNumber('1.234,56')).toBeCloseTo(1234.56, 5)
    expect(parseFormattedNumber('1.2M')).toBeCloseTo(1200000, 5)
    expect(parseFormattedNumber('12%')).toBeCloseTo(0.12, 5)
  })
})
