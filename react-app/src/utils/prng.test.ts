import { describe, it, expect } from 'vitest'

import { hashString, mulberry32 } from './prng'

describe('prng', () => {
  describe('hashString', () => {
    it('should return same hash for same input', () => {
      const input = 'test string'
      const hash1 = hashString(input)
      const hash2 = hashString(input)

      expect(hash1).toBe(hash2)
    })

    it('should return different hashes for different inputs', () => {
      const hash1 = hashString('string1')
      const hash2 = hashString('string2')

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', () => {
      const hash = hashString('')

      expect(typeof hash).toBe('number')
      expect(hash).toBeGreaterThanOrEqual(0)
    })

    it('should handle Turkish characters', () => {
      const hash1 = hashString('İstanbul')
      const hash2 = hashString('Ankara')

      expect(hash1).not.toBe(hash2)
      expect(typeof hash1).toBe('number')
      expect(typeof hash2).toBe('number')
    })

    it('should handle special characters', () => {
      const hash = hashString('!@#$%^&*()')

      expect(typeof hash).toBe('number')
      expect(hash).toBeGreaterThanOrEqual(0)
    })

    it('should handle long strings', () => {
      const longString = 'a'.repeat(1000)
      const hash = hashString(longString)

      expect(typeof hash).toBe('number')
      expect(hash).toBeGreaterThanOrEqual(0)
    })

    it('should be case sensitive', () => {
      const hash1 = hashString('Test')
      const hash2 = hashString('test')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('mulberry32', () => {
    it('should return same sequence for same seed', () => {
      const seed = 12345
      const rng1 = mulberry32(seed)
      const rng2 = mulberry32(seed)

      const sequence1 = Array.from({ length: 10 }, () => rng1())
      const sequence2 = Array.from({ length: 10 }, () => rng2())

      expect(sequence1).toEqual(sequence2)
    })

    it('should return different sequences for different seeds', () => {
      const rng1 = mulberry32(12345)
      const rng2 = mulberry32(54321)

      const sequence1 = Array.from({ length: 10 }, () => rng1())
      const sequence2 = Array.from({ length: 10 }, () => rng2())

      expect(sequence1).not.toEqual(sequence2)
    })

    it('should return values in range [0, 1)', () => {
      const rng = mulberry32(12345)

      for (let i = 0; i < 100; i++) {
        const value = rng()
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThan(1)
      }
    })

    it('should handle seed 0', () => {
      const rng = mulberry32(0)
      const value = rng()

      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it('should handle negative seed', () => {
      const rng = mulberry32(-12345)
      const value = rng()

      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    })

    it('should produce roughly uniform distribution', () => {
      const rng = mulberry32(12345)
      const buckets = [0, 0, 0, 0, 0] // 5 buckets for [0, 0.2), [0.2, 0.4), etc.
      const samples = 1000

      for (let i = 0; i < samples; i++) {
        const value = rng()
        const bucket = Math.floor(value * 5)
        buckets[bucket]++
      }

      // Each bucket should have roughly 200 samples (±50%)
      const expected = samples / 5
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(expected * 0.5)
        expect(count).toBeLessThan(expected * 1.5)
      })
    })

    it('should be deterministic across multiple calls', () => {
      const seed = 99999
      const rng1 = mulberry32(seed)
      const rng2 = mulberry32(seed)

      // Generate 100 values from each
      for (let i = 0; i < 100; i++) {
        expect(rng1()).toBe(rng2())
      }
    })

    it('should not repeat values immediately', () => {
      const rng = mulberry32(12345)
      const values = Array.from({ length: 100 }, () => rng())

      // Check no immediate duplicates
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).not.toBe(values[i - 1])
      }
    })
  })

  describe('integration', () => {
    it('should produce deterministic random sequence from string', () => {
      const featureName = 'İstanbul'
      const seed = hashString(featureName)
      const rng = mulberry32(seed)

      const sequence = Array.from({ length: 5 }, () => rng())

      // Same feature name should produce same sequence
      const seed2 = hashString(featureName)
      const rng2 = mulberry32(seed2)
      const sequence2 = Array.from({ length: 5 }, () => rng2())

      expect(sequence).toEqual(sequence2)
    })

    it('should produce different sequences for different feature names', () => {
      const name1 = 'İstanbul'
      const name2 = 'Ankara'

      const rng1 = mulberry32(hashString(name1))
      const rng2 = mulberry32(hashString(name2))

      const sequence1 = Array.from({ length: 10 }, () => rng1())
      const sequence2 = Array.from({ length: 10 }, () => rng2())

      expect(sequence1).not.toEqual(sequence2)
    })
  })
})
