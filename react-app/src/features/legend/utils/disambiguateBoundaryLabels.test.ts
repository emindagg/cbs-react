import { describe, expect, it } from 'vitest'

import { disambiguateBoundaryLabels } from './disambiguateBoundaryLabels'

describe('disambiguateBoundaryLabels', () => {
  it('returns original labels when there is no duplicate run', () => {
    const values = [84_000, 456_000, 922_000]
    const formatter = (value: number) => `${Math.round(value / 1_000)}k`

    const result = disambiguateBoundaryLabels(values, formatter, { classificationMethod: 'equal' })

    expect(result).toEqual(values.map(formatter))
  })

  it('disambiguates duplicate labels for jenks-like close breaks', () => {
    const values = [1_900_000, 2_100_000, 2_300_000]
    const formatter = (value: number) => `${Math.round(value / 1_000_000)}M`

    const result = disambiguateBoundaryLabels(values, formatter, { classificationMethod: 'jenks' })

    expect(new Set(result).size).toBe(result.length)
    expect(result.some((label) => label !== '2M')).toBe(true)
    expect(result.every((label) => label.endsWith('M'))).toBe(true)
  })

  it('keeps all labels even when values are exactly equal', () => {
    const values = [2_000_000, 2_000_000, 2_000_000]
    const formatter = (value: number) => `${Math.round(value / 1_000_000)}M`

    const result = disambiguateBoundaryLabels(values, formatter, { classificationMethod: 'jenks' })

    expect(result.length).toBe(3)
    expect(result.every((label) => typeof label === 'string' && label.length > 0)).toBe(true)
  })
})
