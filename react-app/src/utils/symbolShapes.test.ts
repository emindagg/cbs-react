import { describe, it, expect } from 'vitest'

import { generateSymbolPath, calculateSymbolSize } from './symbolShapes'

describe('symbolShapes', () => {
  describe('generateSymbolPath', () => {
    const centerX = 50
    const centerY = 50
    const size = 20

    it('should generate circle path', () => {
      const path = generateSymbolPath('circle', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('a')
      expect(typeof path).toBe('string')
    })

    it('should generate square path', () => {
      const path = generateSymbolPath('square', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate triangle path', () => {
      const path = generateSymbolPath('triangle', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate star path', () => {
      const path = generateSymbolPath('star', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate diamond path', () => {
      const path = generateSymbolPath('diamond', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('L')
      expect(path).toContain('Z')
    })

    it('should generate pin path', () => {
      const path = generateSymbolPath('pin', centerX, centerY, size)
      expect(path).toContain('M')
      expect(path).toContain('A')
      expect(path).toContain('Z')
    })

    it('should default to circle for unknown shape', () => {
      const path = generateSymbolPath('unknown' as any, centerX, centerY, size)
      expect(path).toContain('a') // Circle uses arc command
    })

    it('should handle different sizes', () => {
      const small = generateSymbolPath('circle', centerX, centerY, 10)
      const large = generateSymbolPath('circle', centerX, centerY, 50)
      expect(small).not.toBe(large)
    })

    it('should handle different center positions', () => {
      const path1 = generateSymbolPath('square', 10, 10, size)
      const path2 = generateSymbolPath('square', 100, 100, size)
      expect(path1).not.toBe(path2)
    })
  })

  describe('calculateSymbolSize', () => {
    const minValue = 0
    const maxValue = 100
    const minSize = 5
    const maxSize = 50

    describe('linear scaling', () => {
      it('should scale linearly', () => {
        expect(calculateSymbolSize(0, minValue, maxValue, minSize, maxSize, 'linear')).toBe(5)
        expect(calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'linear')).toBe(27.5)
        expect(calculateSymbolSize(100, minValue, maxValue, minSize, maxSize, 'linear')).toBe(50)
      })

      it('should handle min value', () => {
        const result = calculateSymbolSize(minValue, minValue, maxValue, minSize, maxSize, 'linear')
        expect(result).toBe(minSize)
      })

      it('should handle max value', () => {
        const result = calculateSymbolSize(maxValue, minValue, maxValue, minSize, maxSize, 'linear')
        expect(result).toBe(maxSize)
      })
    })

    describe('sqrt scaling', () => {
      it('should scale with square root', () => {
        const result = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'sqrt')
        expect(result).toBeGreaterThan(minSize)
        expect(result).toBeLessThan(maxSize)
        // sqrt(0.5) ≈ 0.707, so result should be around 5 + 0.707 * 45 ≈ 36.8
        expect(result).toBeCloseTo(36.8, 1)
      })

      it('should handle min value', () => {
        const result = calculateSymbolSize(minValue, minValue, maxValue, minSize, maxSize, 'sqrt')
        expect(result).toBe(minSize)
      })

      it('should handle max value', () => {
        const result = calculateSymbolSize(maxValue, minValue, maxValue, minSize, maxSize, 'sqrt')
        expect(result).toBe(maxSize)
      })
    })

    describe('log scaling', () => {
      it('should scale logarithmically', () => {
        const result = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'log')
        expect(result).toBeGreaterThan(minSize)
        expect(result).toBeLessThan(maxSize)
      })

      it('should handle min value', () => {
        const result = calculateSymbolSize(minValue, minValue, maxValue, minSize, maxSize, 'log')
        expect(result).toBe(minSize)
      })

      it('should handle max value', () => {
        const result = calculateSymbolSize(maxValue, minValue, maxValue, minSize, maxSize, 'log')
        expect(result).toBe(maxSize)
      })

      it('should handle zero values', () => {
        const result = calculateSymbolSize(0, 0, 100, minSize, maxSize, 'log')
        expect(result).toBe(minSize)
      })
    })

    describe('edge cases', () => {
      it('should handle min === max', () => {
        const result = calculateSymbolSize(50, 50, 50, minSize, maxSize, 'linear')
        expect(result).toBe((minSize + maxSize) / 2)
      })

      it('should handle negative values', () => {
        const result = calculateSymbolSize(-50, -100, 0, minSize, maxSize, 'linear')
        expect(result).toBe(27.5)
      })

      it('should handle fractional values', () => {
        const result = calculateSymbolSize(0.5, 0, 1, minSize, maxSize, 'linear')
        expect(result).toBe(27.5)
      })

      it('should default to sqrt when no scaling specified', () => {
        const result = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize)
        const sqrtResult = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'sqrt')
        expect(result).toBe(sqrtResult)
      })
    })

    describe('scaling comparison', () => {
      it('should produce different results for different scaling methods', () => {
        const linear = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'linear')
        const sqrt = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'sqrt')
        const log = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'log')

        expect(linear).not.toBe(sqrt)
        expect(linear).not.toBe(log)
        expect(sqrt).not.toBe(log)
      })

      it('should have sqrt > linear for mid values', () => {
        const linear = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'linear')
        const sqrt = calculateSymbolSize(50, minValue, maxValue, minSize, maxSize, 'sqrt')
        expect(sqrt).toBeGreaterThan(linear)
      })
    })
  })
})
