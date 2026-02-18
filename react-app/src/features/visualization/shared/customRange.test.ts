import { describe, expect, it } from 'vitest'

import {
  clampToCustomRange,
  isValueInCustomRange,
  resolveCustomRange,
} from './customRange'

describe('customRange helpers', () => {
  it('returns null when disabled', () => {
    const range = resolveCustomRange({ enabled: false, min: null, center: null, max: null }, [1, 2, 3])
    expect(range).toBeNull()
  })

  it('uses auto bounds when min/max are missing', () => {
    const range = resolveCustomRange(
      { enabled: true, min: null, center: null, max: null, outOfRangeMode: 'transparent' },
      [2, 10, 7],
    )
    expect(range).toEqual({
      enabled: true,
      min: 2,
      max: 10,
      outOfRangeMode: 'transparent',
    })
  })

  it('rejects invalid bounds', () => {
    const range = resolveCustomRange(
      { enabled: true, min: 10, center: null, max: 2, outOfRangeMode: 'gray' },
      [2, 10, 7],
    )
    expect(range).toBeNull()
  })

  it('checks in-range and clamp behavior', () => {
    const range = resolveCustomRange(
      { enabled: true, min: 2, center: null, max: 10, outOfRangeMode: 'gray' },
      [2, 10, 7],
    )
    expect(isValueInCustomRange(2, range)).toBe(true)
    expect(isValueInCustomRange(10, range)).toBe(true)
    expect(isValueInCustomRange(11, range)).toBe(false)
    expect(clampToCustomRange(11, range)).toBe(10)
    expect(clampToCustomRange(1, range)).toBe(2)
  })
})
