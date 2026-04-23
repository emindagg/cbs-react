import { describe, expect, it } from 'vitest'

import {
  coerceNumberFormat,
  coerceNumericColumn,
  detectNumberLocale,
  formatNumber,
  parseFormattedNumber,
  parseWithLocale,
} from './numberFormatter'

describe('numberFormatter', () => {
  it('coerces unknown format to fallback', () => {
    expect(coerceNumberFormat('0a')).toBe('0a')
    expect(coerceNumberFormat('auto', '0a')).toBe('0a')
    expect(coerceNumberFormat(undefined, '0.00')).toBe('0.00')
  })

  it('formats abbreviations and percentages', () => {
    expect(formatNumber(1200, '0a')).toBe('1B')
    expect(formatNumber(1250, '0.[0]a')).toBe('1.3B')
    expect(formatNumber(0.1234, '0.0%')).toBe('12.3%')
  })

  it('parses localized and abbreviated values', () => {
    expect(parseFormattedNumber('1.234,56')).toBeCloseTo(1234.56, 5)
    expect(parseFormattedNumber('15.701.602')).toBe(15701602)
    expect(parseFormattedNumber('15,701,602')).toBe(15701602)
    expect(parseFormattedNumber('1.2M')).toBeCloseTo(1200000, 5)
    expect(parseFormattedNumber('12%')).toBeCloseTo(0.12, 5)
  })

  it('detects column locale using mixed separators', () => {
    const tr = detectNumberLocale(['12,5', '1.250', '61,25'])
    expect(tr.locale).toBe('tr')

    const en = detectNumberLocale(['12.5', '1,250', '61.25'])
    expect(en.locale).toBe('en')
  })

  it('parses with explicit locale', () => {
    expect(parseWithLocale('15.701.602', 'tr')).toBe(15701602)
    expect(parseWithLocale('15,701,602', 'en')).toBe(15701602)
    expect(parseWithLocale('61,5', 'tr')).toBeCloseTo(61.5, 5)
    expect(parseWithLocale('61.5', 'en')).toBeCloseTo(61.5, 5)
  })

  it('coerces a whole column with single locale decision', () => {
    const input = [
      { il: 'A', deger: '1.250' },
      { il: 'B', deger: '2.750' },
      { il: 'C', deger: '61,5' },
    ]
    const { data, report } = coerceNumericColumn(input, 'deger')
    expect(report.locale).toBe('tr')
    expect(data[0].deger).toBe(1250)
    expect(data[2].deger).toBe(61.5)
  })
})
