import { describe, it, expect } from 'vitest'

import { calculateBreaks } from './classification'

describe('classification', () => {
  describe('calculateBreaks', () => {
    describe('equal interval', () => {
      it('should calculate equal interval breaks', () => {
        const values = [10, 20, 30, 40, 50]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks).toHaveLength(6) // n+1 breaks
        expect(breaks[0]).toBe(10)
        expect(breaks[breaks.length - 1]).toBe(50)
      })

      it('should handle single value', () => {
        const values = [42]
        const breaks = calculateBreaks(values, 'equal', 3)

        // simple-statistics returns [42] for single value
        expect(breaks.length).toBeGreaterThanOrEqual(1)
        expect(breaks[0]).toBe(42)
        expect(breaks[breaks.length - 1]).toBe(42)
      })

      it('should handle two values', () => {
        const values = [10, 20]
        const breaks = calculateBreaks(values, 'equal', 2)

        expect(breaks).toHaveLength(3)
        expect(breaks[0]).toBe(10)
        expect(breaks[breaks.length - 1]).toBe(20)
      })

      it('should handle negative values', () => {
        const values = [-50, -30, -10, 10, 30, 50]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks).toHaveLength(6)
        expect(breaks[0]).toBe(-50)
        expect(breaks[breaks.length - 1]).toBe(50)
      })

      it('should handle unsorted input', () => {
        const values = [50, 10, 30, 20, 40]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks).toHaveLength(6)
        expect(breaks[0]).toBe(10)
        expect(breaks[breaks.length - 1]).toBe(50)
      })
    })

    describe('quantile', () => {
      it('should calculate quantile breaks', () => {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        const breaks = calculateBreaks(values, 'quantile', 4)

        expect(breaks).toHaveLength(5)
        expect(breaks[0]).toBe(1)
        expect(breaks[breaks.length - 1]).toBe(10)
        // Quartiles should divide data into equal-sized groups
      })

      it('should handle duplicate values', () => {
        const values = [1, 1, 1, 2, 2, 2, 3, 3, 3]
        const breaks = calculateBreaks(values, 'quantile', 3)

        expect(breaks).toHaveLength(4)
        expect(breaks[0]).toBe(1)
        expect(breaks[breaks.length - 1]).toBe(3)
      })

      it('should handle single value', () => {
        const values = [42]
        const breaks = calculateBreaks(values, 'quantile', 3)

        expect(breaks).toHaveLength(4)
        expect(breaks.every(b => b === 42)).toBe(true)
      })
    })

    describe('jenks (natural breaks)', () => {
      it('should calculate natural breaks', () => {
        const values = [1, 2, 3, 10, 11, 12, 20, 21, 22]
        const breaks = calculateBreaks(values, 'jenks', 3)

        expect(breaks.length).toBeGreaterThanOrEqual(2)
        expect(breaks[0]).toBe(1)
        expect(breaks[breaks.length - 1]).toBe(22)
      })

      it('should handle single value', () => {
        const values = [42]
        const breaks = calculateBreaks(values, 'jenks', 3)

        expect(breaks).toHaveLength(2)
        expect(breaks[0]).toBe(42)
        expect(breaks[1]).toBe(42)
      })

      it('should handle fewer unique values than classes', () => {
        const values = [1, 1, 2, 2, 3, 3]
        const breaks = calculateBreaks(values, 'jenks', 5)

        // Should return breaks for unique values only
        expect(breaks.length).toBeLessThanOrEqual(4) // 3 unique values + 1
      })
    })

    describe('kmeans', () => {
      it('should calculate kmeans breaks', () => {
        const values = [1, 2, 3, 10, 11, 12, 20, 21, 22]
        const breaks = calculateBreaks(values, 'kmeans', 3)

        expect(breaks.length).toBeGreaterThanOrEqual(2)
        expect(breaks[0]).toBe(1)
        expect(breaks[breaks.length - 1]).toBe(22)
      })

      it('should handle single value', () => {
        const values = [42]
        const breaks = calculateBreaks(values, 'kmeans', 3)

        expect(breaks).toHaveLength(2)
        expect(breaks[0]).toBe(42)
        expect(breaks[1]).toBe(42)
      })
    })

    describe('continuous method mapping', () => {
      it('should map continuous-linear to equal', () => {
        const values = [10, 20, 30, 40, 50]
        const breaksEqual = calculateBreaks(values, 'equal', 5)
        const breaksContinuous = calculateBreaks(values, 'continuous-linear', 5)

        expect(breaksContinuous).toEqual(breaksEqual)
      })

      it('should map continuous-quantile to quantile', () => {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        const breaksQuantile = calculateBreaks(values, 'quantile', 4)
        const breaksContinuous = calculateBreaks(values, 'continuous-quantile', 4)

        expect(breaksContinuous).toEqual(breaksQuantile)
      })

      it('should map continuous-natural to jenks', () => {
        const values = [1, 2, 3, 10, 11, 12, 20, 21, 22]
        const breaksJenks = calculateBreaks(values, 'jenks', 3)
        const breaksContinuous = calculateBreaks(values, 'continuous-natural', 3)

        expect(breaksContinuous).toEqual(breaksJenks)
      })
    })

    describe('edge cases', () => {
      it('should handle empty array', () => {
        const values: number[] = []
        const breaks = calculateBreaks(values, 'equal', 3)

        // Should handle gracefully (simple-statistics behavior)
        expect(Array.isArray(breaks)).toBe(true)
      })

      it('should handle very large values', () => {
        const values = [1e6, 2e6, 3e6, 4e6, 5e6]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks).toHaveLength(6)
        expect(breaks[0]).toBe(1e6)
        expect(breaks[breaks.length - 1]).toBe(5e6)
      })

      it('should handle very small values', () => {
        const values = [0.001, 0.002, 0.003, 0.004, 0.005]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks).toHaveLength(6)
        expect(breaks[0]).toBeCloseTo(0.001, 5)
        expect(breaks[breaks.length - 1]).toBeCloseTo(0.005, 5)
      })

      it('should handle zero values', () => {
        const values = [0, 0, 0, 1, 2, 3]
        const breaks = calculateBreaks(values, 'equal', 3)

        expect(breaks).toHaveLength(4)
        expect(breaks[0]).toBe(0)
      })
    })

    describe('breaks properties', () => {
      it('should return sorted breaks', () => {
        const values = [50, 10, 30, 20, 40]
        const breaks = calculateBreaks(values, 'equal', 5)

        for (let i = 1; i < breaks.length; i++) {
          expect(breaks[i]).toBeGreaterThanOrEqual(breaks[i - 1])
        }
      })

      it('should have first break equal to min value', () => {
        const values = [15, 25, 35, 45, 55]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks[0]).toBe(15)
      })

      it('should have last break equal to max value', () => {
        const values = [15, 25, 35, 45, 55]
        const breaks = calculateBreaks(values, 'equal', 5)

        expect(breaks[breaks.length - 1]).toBe(55)
      })
    })
  })
})
