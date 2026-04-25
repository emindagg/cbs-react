import { describe, expect, it } from 'vitest'

import { createInitialSlopeClasses, getSlopeClassColor, getSlopeClassIndex } from './slopeClasses'

describe('slopeClasses', () => {
  it('maps slope percentages to expected classes', () => {
    expect(getSlopeClassIndex(0)).toBe(0)
    expect(getSlopeClassIndex(5.9)).toBe(0)
    expect(getSlopeClassIndex(6)).toBe(1)
    expect(getSlopeClassIndex(12)).toBe(2)
    expect(getSlopeClassIndex(20)).toBe(3)
    expect(getSlopeClassIndex(30)).toBe(4)
    expect(getSlopeClassIndex(120)).toBe(4)
  })

  it('creates mutable class counters without changing definitions', () => {
    const classes = createInitialSlopeClasses()
    classes[0].pixelCount = 10

    expect(createInitialSlopeClasses()[0].pixelCount).toBe(0)
  })

  it('returns RGB color for the last class', () => {
    expect(getSlopeClassColor(4)).toEqual([215, 48, 39])
  })
})
