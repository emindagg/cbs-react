/**
 * Color Schemes for Choropleth Maps
 * Pre-defined color palettes for data visualization
 * Enhanced with Datawrapper-style interpolation support
 */

import type { ColorScheme } from '../types/visualization'
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

  // ColorBrewer Sequential - Yellow-Orange-Brown
  ylorbr: [
    '#ffffe5',
    '#fff7bc',
    '#fee391',
    '#fec44f',
    '#fe9929',
    '#ec7014',
    '#cc4c02',
    '#993404',
    '#662506',
  ],

  // ColorBrewer Sequential - Yellow-Orange-Red
  ylorrd: [
    '#ffffcc',
    '#ffeda0',
    '#fed976',
    '#feb24c',
    '#fd8d3c',
    '#fc4e2a',
    '#e31a1c',
    '#bd0026',
    '#800026',
  ],

  // ColorBrewer Sequential - Yellow-Green-Blue
  ylgnbu: [
    '#ffffd9',
    '#edf8b1',
    '#c7e9b4',
    '#7fcdbb',
    '#41b6c4',
    '#1d91c0',
    '#225ea8',
    '#253494',
    '#081d58',
  ],

  // ColorBrewer Sequential - Yellow-Green
  ylgn: [
    '#ffffe5',
    '#f7fcb9',
    '#d9f0a3',
    '#addd8e',
    '#78c679',
    '#41ab5d',
    '#238443',
    '#006837',
    '#004529',
  ],

  // ColorBrewer Sequential - Reds
  reds: [
    '#fff5f0',
    '#fee0d2',
    '#fcbba1',
    '#fc9272',
    '#fb6a4a',
    '#ef3b2c',
    '#cb181d',
    '#a50f15',
    '#67000d',
  ],

  // ColorBrewer Sequential - Red-Purple
  rdpu: [
    '#fff7f3',
    '#fde0dd',
    '#fcc5c0',
    '#fa9fb5',
    '#f768a1',
    '#dd3497',
    '#ae017e',
    '#7a0177',
    '#49006a',
  ],

  // ColorBrewer Sequential - Purples
  purples: [
    '#fcfbfd',
    '#efedf5',
    '#dadaeb',
    '#bcbddc',
    '#9e9ac8',
    '#807dba',
    '#6a51a3',
    '#54278f',
    '#3f007d',
  ],

  // ColorBrewer Sequential - Purple-Red
  purd: [
    '#f7f4f9',
    '#e7e1ef',
    '#d4b9da',
    '#c994c7',
    '#df65b0',
    '#e7298a',
    '#ce1256',
    '#980043',
    '#67001f',
  ],

  // ColorBrewer Sequential - Purple-Blue-Green
  pubugn: [
    '#fff7fb',
    '#ece2f0',
    '#d0d1e6',
    '#a6bddb',
    '#67a9cf',
    '#3690c0',
    '#02818a',
    '#016c59',
    '#014636',
  ],

  // ColorBrewer Sequential - Purple-Blue
  pubu: [
    '#fff7fb',
    '#ece7f2',
    '#d0d1e6',
    '#a6bddb',
    '#74a9cf',
    '#3690c0',
    '#0570b0',
    '#045a8d',
    '#023858',
  ],

  // ColorBrewer Sequential - Orange-Red
  orrd: [
    '#fff7ec',
    '#fee8c8',
    '#fdd49e',
    '#fdbb84',
    '#fc8d59',
    '#ef6548',
    '#d7301f',
    '#b30000',
    '#7f0000',
  ],

  // ColorBrewer Sequential - Oranges
  oranges: [
    '#fff5eb',
    '#fee6ce',
    '#fdd0a2',
    '#fdae6b',
    '#fd8d3c',
    '#f16913',
    '#d94801',
    '#a63603',
    '#7f2704',
  ],

  // ColorBrewer Sequential - Greys
  greys: [
    '#ffffff',
    '#f0f0f0',
    '#d9d9d9',
    '#bdbdbd',
    '#969696',
    '#737373',
    '#525252',
    '#252525',
    '#000000',
  ],

  // ColorBrewer Sequential - Greens
  greens: [
    '#f7fcf5',
    '#e5f5e0',
    '#c7e9c0',
    '#a1d99b',
    '#74c476',
    '#41ab5d',
    '#238b45',
    '#006d2c',
    '#00441b',
  ],

  // ColorBrewer Sequential - Green-Blue
  gnbu: [
    '#f7fcf0',
    '#e0f3db',
    '#ccebc5',
    '#a8ddb5',
    '#7bccc4',
    '#4eb3d3',
    '#2b8cbe',
    '#0868ac',
    '#084081',
  ],

  // ColorBrewer Sequential - Blue-Purple
  bupu: [
    '#f7fcfd',
    '#e0ecf4',
    '#bfd3e6',
    '#9ebcda',
    '#8c96c6',
    '#8c6bb1',
    '#88419d',
    '#810f7c',
    '#4d004b',
  ],

  // ColorBrewer Sequential - Blue-Green
  bugn: [
    '#f7fcfd',
    '#e5f5f9',
    '#ccece6',
    '#99d8c9',
    '#66c2a4',
    '#41ae76',
    '#238b45',
    '#006d2c',
    '#00441b',
  ],

  // ColorBrewer Sequential - Blues
  blues: [
    '#f7fbff',
    '#deebf7',
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#4292c6',
    '#2171b5',
    '#08519c',
    '#08306b',
  ],

  // ColorBrewer Diverging - Spectral
  spectral: [
    '#9e0142',
    '#d53e4f',
    '#f46d43',
    '#fdae61',
    '#fee08b',
    '#e6f598',
    '#abdda4',
    '#66c2a5',
    '#3288bd',
    '#5e4fa2',
  ],

  // ColorBrewer Diverging - Red-Yellow-Green
  rdylgn: [
    '#a50026',
    '#d73027',
    '#f46d43',
    '#fdae61',
    '#fee08b',
    '#d9ef8b',
    '#a6d96a',
    '#66bd63',
    '#1a9850',
    '#006837',
  ],

  // ColorBrewer Diverging - Red-Yellow-Blue
  rdylbu: [
    '#a50026',
    '#d73027',
    '#f46d43',
    '#fdae61',
    '#fee090',
    '#e0f3f8',
    '#abd9e9',
    '#74add1',
    '#4575b4',
    '#313695',
  ],

  // ColorBrewer Diverging - Red-Grey
  rdgy: [
    '#67001f',
    '#b2182b',
    '#d6604d',
    '#f4a582',
    '#fddbc7',
    '#e0e0e0',
    '#bababa',
    '#878787',
    '#4d4d4d',
    '#1a1a1a',
  ],

  // ColorBrewer Diverging - Red-Blue
  rdbu: [
    '#67001f',
    '#b2182b',
    '#d6604d',
    '#f4a582',
    '#fddbc7',
    '#d1e5f0',
    '#92c5de',
    '#4393c3',
    '#2166ac',
    '#053061',
  ],

  // ColorBrewer Diverging - Purple-Orange
  puor: [
    '#7f3b08',
    '#b35806',
    '#e08214',
    '#fdb863',
    '#fee0b6',
    '#d8daeb',
    '#b2abd2',
    '#8073ac',
    '#542788',
    '#2d004b',
  ],

  // ColorBrewer Diverging - Purple-Green
  prgn: [
    '#40004b',
    '#762a83',
    '#9970ab',
    '#c2a5cf',
    '#e7d4e8',
    '#d9f0d3',
    '#a6dba0',
    '#5aae61',
    '#1b7837',
    '#00441b',
  ],

  // ColorBrewer Diverging - Pink-Yellow-Green
  piyg: [
    '#8e0152',
    '#c51b7d',
    '#de77ae',
    '#f1b6da',
    '#fde0ef',
    '#e6f5d0',
    '#b8e186',
    '#7fbc41',
    '#4d9221',
    '#276419',
  ],

  // ColorBrewer Diverging - Brown-Blue-Green
  brbg: [
    '#543005',
    '#8c510a',
    '#bf812d',
    '#dfc27d',
    '#f6e8c3',
    '#c7eae5',
    '#80cdc1',
    '#35978f',
    '#01665e',
    '#003c30',
  ],
}

/**
 * Color scheme metadata for UI display
 */
export const COLOR_SCHEME_INFO: Record<ColorScheme, { name: string; type: 'sequential' | 'diverging' }> = {
  // Original
  viridis: { name: 'Viridis', type: 'sequential' },

  // ColorBrewer Sequential
  ylorbr: { name: 'Yellow-Orange-Brown', type: 'sequential' },
  ylorrd: { name: 'Yellow-Orange-Red', type: 'sequential' },
  ylgnbu: { name: 'Yellow-Green-Blue', type: 'sequential' },
  ylgn: { name: 'Yellow-Green', type: 'sequential' },
  reds: { name: 'Reds', type: 'sequential' },
  rdpu: { name: 'Red-Purple', type: 'sequential' },
  purples: { name: 'Purples', type: 'sequential' },
  purd: { name: 'Purple-Red', type: 'sequential' },
  pubugn: { name: 'Purple-Blue-Green', type: 'sequential' },
  pubu: { name: 'Purple-Blue', type: 'sequential' },
  orrd: { name: 'Orange-Red', type: 'sequential' },
  oranges: { name: 'Oranges', type: 'sequential' },
  greys: { name: 'Greys', type: 'sequential' },
  greens: { name: 'Greens', type: 'sequential' },
  gnbu: { name: 'Green-Blue', type: 'sequential' },
  bupu: { name: 'Blue-Purple', type: 'sequential' },
  bugn: { name: 'Blue-Green', type: 'sequential' },
  blues: { name: 'Blues', type: 'sequential' },

  // ColorBrewer Diverging
  spectral: { name: 'Spectral', type: 'diverging' },
  rdylgn: { name: 'Red-Yellow-Green', type: 'diverging' },
  rdylbu: { name: 'Red-Yellow-Blue', type: 'diverging' },
  rdgy: { name: 'Red-Grey', type: 'diverging' },
  rdbu: { name: 'Red-Blue', type: 'diverging' },
  puor: { name: 'Purple-Orange', type: 'diverging' },
  prgn: { name: 'Purple-Green', type: 'diverging' },
  piyg: { name: 'Pink-Yellow-Green', type: 'diverging' },
  brbg: { name: 'Brown-Blue-Green', type: 'diverging' },
}

/**
 * Get color palette for a given class count
 * Uses simple sampling from the base palette
 */
export function getColorPalette(colorScheme: ColorScheme, classCount: number): string[] {
  const fullPalette = COLOR_SCHEMES[colorScheme]
  const step = Math.floor((fullPalette.length - 1) / (classCount - 1))
  const palette: string[] = []

  for (let i = 0; i < classCount; i++) {
    const index = Math.min(i * step, fullPalette.length - 1)
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
 * Get color for a value with continuous interpolation
 * Maps value to color using smooth transitions
 */
export function getContinuousColorForValue(
  value: number,
  values: number[],
  colorScheme: ColorScheme,
  colorSpace: ColorSpace = 'lab',
): string {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  if (max === min) {
    return COLOR_SCHEMES[colorScheme][0]
  }

  const normalized = (value - min) / (max - min)
  return getContinuousColor(normalized, colorScheme, colorSpace)
}
