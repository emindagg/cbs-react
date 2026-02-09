/**
 * Color Schemes for Choropleth Maps
 * Pre-defined color palettes for data visualization
 * Enhanced with Datawrapper-style interpolation support
 */

import type { ColorScheme, InterpolationMethod } from '../types/visualization'
import { normalizeValue } from '../utils/classificationMethods'
import { generateColorScale, interpolateColor, type ColorSpace } from '../utils/colorInterpolation'

export const COLOR_SCHEMES: Record<ColorScheme, string[]> = {
  // Original Viridis
  viridis: [
    '#440154',
    '#472777',
    '#3b528b',
    '#2c728e',
    '#21918c',
    '#27ad81',
    '#5ec962',
    '#aadc32',
    '#fde725',
  ],

  // Datawrapper Sequential - Green-Blue
  greenBlue: [
    '#f0f9e8',
    '#c5e9c6',
    '#96d6c0',
    '#6bc0c6',
    '#4ba8c9',
    '#3291c0',
    '#1a7ab5',
    '#1162a5',
    '#254b8c',
  ],

  // Datawrapper Sequential - Sunset (Yellow-Purple)
  sunset: [
    '#fcfcbe',
    '#fdd499',
    '#fcaa7a',
    '#f57f66',
    '#e45563',
    '#ba3c75',
    '#8c297b',
    '#5b1c74',
    '#2c1160',
  ],

  // Datawrapper Sequential - Plasma
  plasma: [
    '#f0f723',
    '#f8cd29',
    '#f7a539',
    '#ec7e50',
    '#d8586a',
    '#b73387',
    '#8a159b',
    '#51049e',
    '#0d0787',
  ],

  // Datawrapper Sequential - Yellow-Green
  yellowGreen: [
    '#fefaca',
    '#dfecaf',
    '#bfde94',
    '#9ecf79',
    '#7cc15e',
    '#5ab344',
    '#39a52d',
    '#1a981c',
    '#008b15',
  ],

  // Datawrapper Sequential - Pink-Purple
  pinkPurple: [
    '#feebe2',
    '#fdd3cd',
    '#fcbcbd',
    '#faa4b6',
    '#f984ab',
    '#f15e9e',
    '#d22e90',
    '#a91183',
    '#7a0177',
  ],

  // Datawrapper Sequential - Yellow-Blue
  yellowBlue: [
    '#ffffcc',
    '#dcf1bd',
    '#b5e2b6',
    '#88d1ba',
    '#60c2c0',
    '#3eafc3',
    '#318dbb',
    '#2963ab',
    '#253494',
  ],

  // Datawrapper Sequential - Rose-Purple
  rosePurple: [
    '#f9ddda',
    '#f4c2ca',
    '#eca8bf',
    '#df8fb8',
    '#ce78b3',
    '#b565af',
    '#9855a7',
    '#78479a',
    '#573b88',
  ],

  // Datawrapper Diverging - Brown-Teal
  brownTeal: [
    '#8c510a',
    '#c59b4e',
    '#e7ce94',
    '#f6eccd',
    '#f5f7ea',
    '#d3ede6',
    '#91cfc9',
    '#44a199',
    '#01665e',
  ],

  // Datawrapper Diverging - Pink-Green
  pinkGreen: [
    '#c51b7d',
    '#e081b6',
    '#f3c2dc',
    '#fce6ee',
    '#faf6ea',
    '#ebf5d7',
    '#c4e69d',
    '#8cc658',
    '#4d9221',
  ],

  // Datawrapper Diverging - Red-Blue
  redBlue: [
    '#b2182b',
    '#e06e54',
    '#f6b395',
    '#fce2d0',
    '#f8f6e9',
    '#dbe9ee',
    '#9cc7e0',
    '#5698c6',
    '#2166ac',
  ],

  // Datawrapper Diverging - Red-Teal
  redTeal: [
    '#c13e2e',
    '#de6050',
    '#ef8675',
    '#f2b19d',
    '#e9e0c8',
    '#b2cac4',
    '#7ab2b9',
    '#3e96a7',
    '#00768d',
  ],
}

/**
 * Color scheme metadata for UI display
 */
export const COLOR_SCHEME_INFO: Record<ColorScheme, { name: string; type: 'sequential' | 'diverging' }> = {
  viridis: { name: 'Viridis', type: 'sequential' },

  // Datawrapper Sequential
  greenBlue: { name: 'Yeşil-Mavi', type: 'sequential' },
  sunset: { name: 'Gün Batımı', type: 'sequential' },
  plasma: { name: 'Plasma', type: 'sequential' },
  yellowGreen: { name: 'Sarı-Yeşil', type: 'sequential' },
  pinkPurple: { name: 'Pembe-Mor', type: 'sequential' },
  yellowBlue: { name: 'Sarı-Mavi', type: 'sequential' },
  rosePurple: { name: 'Gül-Mor', type: 'sequential' },

  // Datawrapper Diverging
  brownTeal: { name: 'Kahve-Deniz', type: 'diverging' },
  pinkGreen: { name: 'Pembe-Yeşil', type: 'diverging' },
  redBlue: { name: 'Kırmızı-Mavi', type: 'diverging' },
  redTeal: { name: 'Kırmızı-Deniz', type: 'diverging' },
}

/**
 * Get color palette for a given class count
 * Uses simple sampling from the base palette
 */
export function getColorPalette(colorScheme: ColorScheme, classCount: number): string[] {
  const fullPalette = COLOR_SCHEMES[colorScheme]

  if (classCount <= 1) return [fullPalette[0]]
  if (classCount >= fullPalette.length) return [...fullPalette]

  // Evenly sample from full palette
  const palette: string[] = []
  for (let i = 0; i < classCount; i++) {
    const index = Math.round(i * (fullPalette.length - 1) / (classCount - 1))
    palette.push(fullPalette[index])
  }

  return palette
}

/**
 * Get interpolated color palette with advanced color space support
 * Inspired by Datawrapper's color interpolation
 */
export function getInterpolatedColorPalette(
  colorScheme: ColorScheme,
  classCount: number,
  colorSpace: ColorSpace = 'lab',
): string[] {
  const baseColors = COLOR_SCHEMES[colorScheme]

  // For small class counts, use simple sampling
  if (classCount <= baseColors.length) {
    return getColorPalette(colorScheme, classCount)
  }

  // For larger class counts, use interpolation
  return generateColorScale(baseColors, classCount, colorSpace)
}

/**
 * Get continuous color for a normalized value (0-1)
 * Uses smooth interpolation in specified color space
 */
export function getContinuousColor(
  value: number,
  colorScheme: ColorScheme,
  colorSpace: ColorSpace = 'lab',
): string {
  const colors = COLOR_SCHEMES[colorScheme]
  const normalizedValue = Math.max(0, Math.min(1, value))

  // Calculate position in color array
  const position = normalizedValue * (colors.length - 1)
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)

  if (lowerIndex === upperIndex) {
    return colors[lowerIndex]
  }

  // Interpolate between adjacent colors
  const t = position - lowerIndex
  return interpolateColor(colors[lowerIndex], colors[upperIndex], t, colorSpace)
}

/**
 * Get color for a value based on breaks (classed/stepped scale)
 */
export function getColorForValue(value: number, breaks: number[], colorPalette: string[]): string {
  for (let i = 0; i < breaks.length - 1; i++) {
    if (value >= breaks[i] && value <= breaks[i + 1]) {
      return colorPalette[i]
    }
  }
  return colorPalette[colorPalette.length - 1]
}

/**
 * Get color for a value with continuous interpolation.
 * Seçilen interpolasyon yöntemine göre (equidistant, quantiles-*, natural-9) 0-1 normalizasyonu yapar.
 */
export function getContinuousColorForValue(
  value: number,
  values: number[],
  colorScheme: ColorScheme,
  colorSpace: ColorSpace = 'lab',
  interpolation: InterpolationMethod = 'equidistant',
): string {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  if (max === min) {
    return COLOR_SCHEMES[colorScheme][0]
  }

  const normalized = normalizeValue(value, min, max, interpolation, values)
  return getContinuousColor(normalized, colorScheme, colorSpace)
}
