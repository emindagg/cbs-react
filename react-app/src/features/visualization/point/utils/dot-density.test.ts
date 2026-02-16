import { describe, it, expect } from 'vitest'

import { expectNiceNumber, expectValidMapLibreExpression } from '@/test/helpers'

import { calculateSmartDotValue, buildZoomRadius } from './dot-density'

describe('dot-density', () => {
  describe('calculateSmartDotValue', () => {
    it('should return 1 for empty array', () => {
      const result = calculateSmartDotValue([])
      expect(result).toBe(1)
    })

    it('should return nice number for typical values', () => {
      const values = [100, 200, 300, 400, 500]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expectNiceNumber(result)
    })

    it('should handle single value', () => {
      const values = [1000]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(1000)
    })

    it('should handle very small values', () => {
      const values = [0.1, 0.2, 0.3, 0.4, 0.5]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      // Function returns at least 1 (see implementation)
      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should handle very large values', () => {
      const values = [1000000, 2000000, 3000000, 4000000, 5000000]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expectNiceNumber(result)
    })

    it('should handle negative values (absolute)', () => {
      const values = [-100, -200, -300, -400, -500]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expectNiceNumber(result)
    })

    it('should handle mixed positive and negative values', () => {
      const values = [-100, 200, -300, 400, -500]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expectNiceNumber(result)
    })

    it('should return value <= average value', () => {
      const values = [100, 200, 300, 400, 500]
      const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
      const result = calculateSmartDotValue(values)

      expect(result).toBeLessThanOrEqual(Math.round(avgValue))
    })

    it('should return at least 1', () => {
      const values = [0.001, 0.002, 0.003]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should produce consistent results for same input', () => {
      const values = [100, 200, 300, 400, 500]
      const result1 = calculateSmartDotValue(values)
      const result2 = calculateSmartDotValue(values)

      expect(result1).toBe(result2)
    })

    it('should handle zero values', () => {
      const values = [0, 0, 100, 200, 300]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
    })

    it('should produce nice numbers for various ranges', () => {
      const testCases = [
        [10, 20, 30, 40, 50],
        [100, 200, 300, 400, 500],
        [1000, 2000, 3000, 4000, 5000],
        [50, 100, 150, 200, 250],
      ]

      testCases.forEach(values => {
        const result = calculateSmartDotValue(values)
        expectNiceNumber(result)
      })
    })

    it('should scale appropriately with data size', () => {
      const smallDataset = [100, 200, 300]
      const largeDataset = Array.from({ length: 100 }, (_, i) => (i + 1) * 100)

      const smallResult = calculateSmartDotValue(smallDataset)
      const largeResult = calculateSmartDotValue(largeDataset)

      // Larger dataset should generally have larger dot value
      expect(largeResult).toBeGreaterThanOrEqual(smallResult)
    })

    it('should handle uniform values', () => {
      const values = [100, 100, 100, 100, 100]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(100)
    })

    it('should handle highly variable values', () => {
      const values = [1, 10, 100, 1000, 10000]
      const result = calculateSmartDotValue(values)

      expect(result).toBeGreaterThan(0)
      expectNiceNumber(result)
    })
  })

  describe('buildZoomRadius', () => {
    it('should return valid MapLibre expression', () => {
      const dotSize = 5
      const expression = buildZoomRadius(dotSize)

      expectValidMapLibreExpression(expression)
    })

    it('should have correct structure', () => {
      const dotSize = 5
      const expression = buildZoomRadius(dotSize)

      expect(expression[0]).toBe('interpolate')
      expect(expression[1]).toEqual(['linear'])
      expect(expression[2]).toEqual(['zoom'])
    })

    it('should have three zoom stops', () => {
      const dotSize = 5
      const expression = buildZoomRadius(dotSize)

      // Format: ['interpolate', ['linear'], ['zoom'], zoom1, size1, zoom2, size2, zoom3, size3]
      expect(expression).toHaveLength(9) // 3 base + 3 stops × 2 values
    })

    it('should scale correctly at zoom 4', () => {
      const dotSize = 10
      const expression = buildZoomRadius(dotSize)

      // Zoom 4 should be dotSize × 0.5
      expect(expression[3]).toBe(4) // zoom level
      expect(expression[4]).toBe(dotSize * 0.5) // radius
    })

    it('should use base size at zoom 6', () => {
      const dotSize = 10
      const expression = buildZoomRadius(dotSize)

      // Zoom 6 should be dotSize (reference)
      expect(expression[5]).toBe(6) // zoom level
      expect(expression[6]).toBe(dotSize) // radius
    })

    it('should scale correctly at zoom 10', () => {
      const dotSize = 10
      const expression = buildZoomRadius(dotSize)

      // Zoom 10 should be dotSize × 3
      expect(expression[7]).toBe(10) // zoom level
      expect(expression[8]).toBe(dotSize * 3) // radius
    })

    it('should handle small dot sizes', () => {
      const dotSize = 2
      const expression = buildZoomRadius(dotSize)

      expect(expression[4]).toBe(1) // zoom 4: 2 × 0.5
      expect(expression[6]).toBe(2) // zoom 6: 2
      expect(expression[8]).toBe(6) // zoom 10: 2 × 3
    })

    it('should handle large dot sizes', () => {
      const dotSize = 20
      const expression = buildZoomRadius(dotSize)

      expect(expression[4]).toBe(10) // zoom 4: 20 × 0.5
      expect(expression[6]).toBe(20) // zoom 6: 20
      expect(expression[8]).toBe(60) // zoom 10: 20 × 3
    })

    it('should handle fractional dot sizes', () => {
      const dotSize = 5.5
      const expression = buildZoomRadius(dotSize)

      expect(expression[4]).toBeCloseTo(2.75, 2) // zoom 4: 5.5 × 0.5
      expect(expression[6]).toBe(5.5) // zoom 6: 5.5
      expect(expression[8]).toBeCloseTo(16.5, 2) // zoom 10: 5.5 × 3
    })

    it('should produce consistent results for same input', () => {
      const dotSize = 8
      const expression1 = buildZoomRadius(dotSize)
      const expression2 = buildZoomRadius(dotSize)

      expect(expression1).toEqual(expression2)
    })
  })

  describe('integration', () => {
    it('should work together for typical workflow', () => {
      // 1. Calculate smart dot value from data
      const dataValues = [100, 200, 300, 400, 500]
      const dotValue = calculateSmartDotValue(dataValues)

      expect(dotValue).toBeGreaterThan(0)
      expectNiceNumber(dotValue)

      // 2. Build zoom radius expression with default dot size
      const dotSize = 5
      const zoomExpression = buildZoomRadius(dotSize)

      expectValidMapLibreExpression(zoomExpression)
      expect(zoomExpression[6]).toBe(dotSize) // Reference size at zoom 6
    })

    it('should handle edge case: very small dataset', () => {
      const dataValues = [10]
      const dotValue = calculateSmartDotValue(dataValues)

      expect(dotValue).toBeGreaterThan(0)
      expect(dotValue).toBeLessThanOrEqual(10)

      const zoomExpression = buildZoomRadius(3)
      expectValidMapLibreExpression(zoomExpression)
    })

    it('should handle edge case: very large dataset', () => {
      const dataValues = Array.from({ length: 1000 }, (_, i) => (i + 1) * 100)
      const dotValue = calculateSmartDotValue(dataValues)

      expect(dotValue).toBeGreaterThan(0)
      expectNiceNumber(dotValue)

      const zoomExpression = buildZoomRadius(5)
      expectValidMapLibreExpression(zoomExpression)
    })
  })
})
