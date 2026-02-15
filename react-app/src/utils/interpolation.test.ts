import { describe, it, expect } from 'vitest'

import {
  calculateBreaksFromInterpolation,
  getClassCountFromInterpolation,
  normalizeValue,
} from './interpolation'

describe('interpolation', () => {
  describe('calculateBreaksFromInterpolation', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    it('should calculate equidistant breaks', () => {
      const breaks = calculateBreaksFromInterpolation(values, 'equidistant')
      expect(breaks.length).toBeGreaterThan(0)
      expect(breaks[0]).toBe(10)
      expect(breaks[breaks.length - 1]).toBe(100)
    })

    it('should calculate quantiles-4 breaks', () => {
      const breaks = calculateBreaksFromInterpolation(values, 'quantiles-4')
      expect(breaks.length).toBe(5) // n+1 breaks
    })

    it('should calculate quantiles-5 breaks', () => {
      const breaks = calculateBreaksFromInterpolation(values, 'quantiles-5')
      expect(breaks.length).toBe(6)
    })

    it('should calculate quantiles-10 breaks', () => {
      const breaks = calculateBreaksFromInterpolation(values, 'quantiles-10')
      expect(breaks.length).toBe(11)
    })

    it('should calculate natural-9 breaks', () => {
      const breaks = calculateBreaksFromInterpolation(values, 'natural-9')
      expect(breaks.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle unsorted input', () => {
      const unsorted = [50, 10, 90, 30, 70]
      const breaks = calculateBreaksFromInterpolation(unsorted, 'equidistant')
      expect(breaks[0]).toBe(10)
      expect(breaks[breaks.length - 1]).toBe(90)
    })
  })

  describe('getClassCountFromInterpolation', () => {
    it('should return correct class count for quantiles-4', () => {
      expect(getClassCountFromInterpolation('quantiles-4')).toBe(4)
    })

    it('should return correct class count for quantiles-5', () => {
      expect(getClassCountFromInterpolation('quantiles-5')).toBe(5)
    })

    it('should return correct class count for quantiles-10', () => {
      expect(getClassCountFromInterpolation('quantiles-10')).toBe(10)
    })

    it('should return correct class count for natural-9', () => {
      expect(getClassCountFromInterpolation('natural-9')).toBe(9)
    })

    it('should return default 5 for equidistant', () => {
      expect(getClassCountFromInterpolation('equidistant')).toBe(5)
    })
  })

  describe('normalizeValue', () => {
    it('should normalize to 0-1 range for equidistant', () => {
      expect(normalizeValue(0, 0, 100, 'equidistant')).toBe(0)
      expect(normalizeValue(50, 0, 100, 'equidistant')).toBe(0.5)
      expect(normalizeValue(100, 0, 100, 'equidistant')).toBe(1)
    })

    it('should handle min === max', () => {
      expect(normalizeValue(50, 50, 50, 'equidistant')).toBe(0.5)
    })

    it('should normalize with quantile interpolation', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const result = normalizeValue(50, 10, 100, 'quantiles-5', values)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1)
    })

    it('should handle value at min', () => {
      const values = [10, 20, 30, 40, 50]
      const result = normalizeValue(10, 10, 50, 'quantiles-4', values)
      expect(result).toBe(0)
    })

    it('should handle value at max', () => {
      const values = [10, 20, 30, 40, 50]
      const result = normalizeValue(50, 10, 50, 'quantiles-4', values)
      expect(result).toBe(1)
    })

    it('should handle negative values', () => {
      expect(normalizeValue(-50, -100, 0, 'equidistant')).toBe(0.5)
    })

    it('should handle fractional values', () => {
      expect(normalizeValue(0.5, 0, 1, 'equidistant')).toBe(0.5)
    })

    it('should default to equidistant when no interpolation specified', () => {
      const result = normalizeValue(50, 0, 100)
      expect(result).toBe(0.5)
    })
  })
})
