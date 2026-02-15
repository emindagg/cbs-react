import { describe, it, expect } from 'vitest'

import { getColorPalette, getContinuousColor, COLOR_SCHEMES } from './colorSchemes'

describe('colorSchemes', () => {
  describe('getColorPalette', () => {
    it('should return correct number of colors', () => {
      const palette = getColorPalette('viridis', 5)
      expect(palette).toHaveLength(5)
    })

    it('should return array of color strings', () => {
      const palette = getColorPalette('greenBlue', 3)
      expect(Array.isArray(palette)).toBe(true)
      palette.forEach(color => {
        expect(typeof color).toBe('string')
      })
    })

    it('should handle different class counts', () => {
      const palette3 = getColorPalette('viridis', 3)
      const palette7 = getColorPalette('viridis', 7)
      expect(palette3).toHaveLength(3)
      expect(palette7).toHaveLength(7)
    })

    it('should handle all available schemes', () => {
      const schemes = Object.keys(COLOR_SCHEMES) as Array<keyof typeof COLOR_SCHEMES>
      schemes.forEach(scheme => {
        const palette = getColorPalette(scheme, 5)
        expect(palette).toHaveLength(5)
      })
    })

    it('should return different colors for different schemes', () => {
      const viridis = getColorPalette('viridis', 5)
      const sunset = getColorPalette('sunset', 5)
      expect(viridis).not.toEqual(sunset)
    })
  })

  describe('getContinuousColor', () => {
    it('should return color for normalized value', () => {
      const color = getContinuousColor(0.5, 'viridis', 'lab')
      expect(typeof color).toBe('string')
    })

    it('should handle value at 0', () => {
      const color = getContinuousColor(0, 'viridis', 'lab')
      expect(typeof color).toBe('string')
    })

    it('should handle value at 1', () => {
      const color = getContinuousColor(1, 'viridis', 'lab')
      expect(typeof color).toBe('string')
    })

    it('should handle values between 0 and 1', () => {
      const color1 = getContinuousColor(0.25, 'greenBlue', 'lab')
      const color2 = getContinuousColor(0.75, 'greenBlue', 'lab')
      expect(typeof color1).toBe('string')
      expect(typeof color2).toBe('string')
    })

    it('should return different colors for different values', () => {
      const color1 = getContinuousColor(0.2, 'viridis', 'lab')
      const color2 = getContinuousColor(0.8, 'viridis', 'lab')
      expect(color1).not.toBe(color2)
    })

    it('should handle different color schemes', () => {
      const viridis = getContinuousColor(0.5, 'viridis', 'lab')
      const sunset = getContinuousColor(0.5, 'sunset', 'lab')
      // Different schemes should produce different colors (usually)
      expect(typeof viridis).toBe('string')
      expect(typeof sunset).toBe('string')
    })

    it('should handle different interpolation modes', () => {
      const lab = getContinuousColor(0.5, 'viridis', 'lab')
      const rgb = getContinuousColor(0.5, 'viridis', 'rgb')
      // Both should return valid colors (may or may not be different)
      expect(typeof lab).toBe('string')
      expect(typeof rgb).toBe('string')
    })
  })

  describe('COLOR_SCHEMES', () => {
    it('should have defined color schemes', () => {
      expect(COLOR_SCHEMES).toBeDefined()
      expect(typeof COLOR_SCHEMES).toBe('object')
    })

    it('should have common schemes', () => {
      expect(COLOR_SCHEMES).toHaveProperty('viridis')
      expect(COLOR_SCHEMES).toHaveProperty('greenBlue')
      expect(COLOR_SCHEMES).toHaveProperty('sunset')
    })

    it('should have array values for each scheme', () => {
      Object.values(COLOR_SCHEMES).forEach(scheme => {
        expect(Array.isArray(scheme)).toBe(true)
        expect(scheme.length).toBeGreaterThan(0)
      })
    })
  })
})
