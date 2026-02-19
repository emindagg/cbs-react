import { describe, expect, it } from 'vitest'

import {
  clampLegendClassCount,
  MAX_CUSTOM_BREAK_VALUES,
  MAX_LEGEND_CLASSES,
  MIN_CUSTOM_BREAK_VALUES,
  MIN_LEGEND_CLASSES,
} from './legendClassCount'

describe('legendClassCount', () => {
  it('clamps class count into 3-7 range', () => {
    expect(clampLegendClassCount(2)).toBe(MIN_LEGEND_CLASSES)
    expect(clampLegendClassCount(3)).toBe(3)
    expect(clampLegendClassCount(7)).toBe(7)
    expect(clampLegendClassCount(9)).toBe(MAX_LEGEND_CLASSES)
  })

  it('rounds decimal values before clamping', () => {
    expect(clampLegendClassCount(5.8)).toBe(6)
  })

  it('exposes custom break boundaries aligned with class count limits', () => {
    expect(MIN_CUSTOM_BREAK_VALUES).toBe(4)
    expect(MAX_CUSTOM_BREAK_VALUES).toBe(8)
  })
})

