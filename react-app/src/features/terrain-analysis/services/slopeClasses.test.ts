import { describe, expect, it } from 'vitest'

import { createInitialSlopeClasses, getSlopeClassColor, getSlopeClassIndex } from './slopeClasses'

describe('slopeClasses', () => {
  it('maps slope percentages to expected classes', () => {
    expect(getSlopeClassIndex(0)).toBe(0)
    expect(getSlopeClassIndex(9.9)).toBe(0)
    expect(getSlopeClassIndex(10)).toBe(1)
    expect(getSlopeClassIndex(20)).toBe(2)
    expect(getSlopeClassIndex(30)).toBe(3)
    expect(getSlopeClassIndex(40)).toBe(4)
    expect(getSlopeClassIndex(80)).toBe(4)
  })

  it('creates mutable class counters without changing definitions', () => {
    const classes = createInitialSlopeClasses()
    classes[0].pixelCount = 10

    expect(createInitialSlopeClasses()[0].pixelCount).toBe(0)
  })

  it('returns RGB color for a class', () => {
    expect(getSlopeClassColor(4)).toEqual([255, 22, 22])
  })
})
