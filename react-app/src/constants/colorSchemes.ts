/**
 * Color Schemes for Choropleth Maps
 * Pre-defined color palettes for data visualization
 * Chroma.js-based color interpolation
 */

import chroma from 'chroma-js'

import type { ColorScheme, InterpolationMethod } from '../types/visualization'
import { type ColorSpace, generateColorScale } from '../utils/colorInterpolation'
import { normalizeValue } from '../utils/interpolation'

export const COLOR_SCHEMES: Record<ColorScheme, string[]> = {
  // Viridis
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

  // Yeşil-Mavi
  greenBlue: [
    '#f0f9e8',
    '#b6e3bb',
    '#75c8c5',
    '#4ba8c9',
    '#2989bd',
    '#0a6aad',
    '#254b8c',
  ],

  // Gün Batımı
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

  // Plazma
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

  // Sarı-Yeşil
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

  // Pembe-Mor
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

  // Sarı-Mavi
  yellowBlue: [
    '#ffffcc',
    '#c7e9b4',
    '#7fcdbb',
    '#41b6c4',
    '#2c7fb8',
    '#225ea8',
    '#253494',
  ],

  // Gül-Mor
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

  // Kahve-Deniz (Ayrık)
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

  // Pembe-Yeşil (Ayrık)
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

  // Kırmızı-Mavi (Ayrık)
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

  // Kırmızı-Deniz (Ayrık)
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

  // Deniz Yeşili
  teal: [
    '#E0F2F1',
    '#B2DFDB',
    '#80CBC4',
    '#4DB6AC',
    '#26A69A',
    '#00897B',
    '#00695C',
    '#004D40',
    '#00251A',
  ],

  // Arduvaz
  slate: [
    '#F8FAFC',
    '#F1F5F9',
    '#E2E8F0',
    '#CBD5E1',
    '#94A3B8',
    '#64748B',
    '#475569',
    '#334155',
    '#0F172A',
  ],

  // Turuncu
  orange: [
    '#FFF7ED',
    '#FFEDD5',
    '#FED7AA',
    '#FDBA74',
    '#FB923C',
    '#F97316',
    '#EA580C',
    '#9A3412',
    '#431407',
  ],

  // Mor-Yeşil Ayrık (Purple and Green 5)
  tealPurple: [
    '#762a83',
    '#946ba3',
    '#af8dc3',
    '#e7d4e8',
    '#f7f7f7',
    '#d9f0d3',
    '#7fbf7b',
    '#4d9f59',
    '#1b7837',
  ],

  // Kırmızı-Mavi Ayrık
  redBlueDiverging: [
    '#7F1D1D',
    '#B91C1C',
    '#EF4444',
    '#FCA5A5',
    '#F8FAFC',
    '#93C5FD',
    '#3B82F6',
    '#1D4ED8',
    '#1E3A8A',
  ],

  // Yükseklik - Klasik Hipsometrik (ESRI Terrain)
  elevationTerrain: [
    '#006994',
    '#3a9e6f',
    '#7dbf6a',
    '#c8d96b',
    '#e8c84a',
    '#c89030',
    '#8c5820',
    '#6b3a18',
    '#f0ece8',
  ],

  // Yükseklik - Sadece Kara
  elevationLand: [
    '#aad46f',
    '#78c14a',
    '#d4d96e',
    '#e8c84a',
    '#d4a030',
    '#b07028',
    '#8c5020',
    '#6b3818',
    '#d8d0c8',
  ],

  // Yükseklik - Analitik / DEM Screen
  elevationAnalytic: [
    '#1a9641',
    '#a6d96a',
    '#ffffbf',
    '#fdae61',
    '#d7191c',
    '#a50026',
    '#7b0015',
    '#4d0009',
    '#ffffff',
  ],

  // Yükseklik - Arktik / Kar Vurgulu
  elevationArctic: [
    '#2b5f8e',
    '#4f9dba',
    '#8ecae6',
    '#a8dadc',
    '#e9f5db',
    '#ffffb3',
    '#c8b560',
    '#8b6914',
    '#ffffff',
  ],

  // Boncuklu Pastel (Kategorik)
  tropicalBliss: [
    '#e65154',
    '#26b6ff',
    '#67e6d1',
    '#cd76d6',
    '#ffca8c',
    '#ff8cd9',
    '#d99d5b',
    '#c8f2a9',
    '#d4b8ff',
  ],

  // Renk Körü Güvenli / Okabe-Ito (Kategorik)
  colorblindSafe: [
    '#E69F00',
    '#56B4E9',
    '#009E73',
    '#F0E442',
    '#0072B2',
    '#D55E00',
    '#CC79A7',
    '#000000',
    '#999999',
  ],

  // Maviler (ColorBrewer Blues)
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

  // Kırmızılar (ColorBrewer Reds)
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

  // Yeşiller (ColorBrewer Greens)
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

  // Morlar (ColorBrewer Purples)
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

  // Kehribar
  amber: [
    '#fff8e1',
    '#ffecb3',
    '#ffe082',
    '#ffd54f',
    '#ffca28',
    '#ffb300',
    '#ff8f00',
    '#e65100',
    '#bf360c',
  ],
}

/**
 * Color scheme metadata for UI display
 */
export const COLOR_SCHEME_INFO: Record<ColorScheme, { name: string; type: 'sequential' | 'diverging' }> = {
  viridis: { name: 'Viridis', type: 'sequential' },

  // Sıralı Paletler
  greenBlue: { name: 'Yeşil-Mavi', type: 'sequential' },
  sunset: { name: 'Gün Batımı', type: 'sequential' },
  plasma: { name: 'Plazma', type: 'sequential' },
  yellowGreen: { name: 'Sarı-Yeşil', type: 'sequential' },
  pinkPurple: { name: 'Pembe-Mor', type: 'sequential' },
  yellowBlue: { name: 'Sarı-Mavi', type: 'sequential' },
  rosePurple: { name: 'Gül-Mor', type: 'sequential' },

  // Ayrık Paletler
  brownTeal: { name: 'Kahve-Deniz', type: 'diverging' },
  pinkGreen: { name: 'Pembe-Yeşil', type: 'diverging' },
  redBlue: { name: 'Kırmızı-Mavi', type: 'diverging' },
  redTeal: { name: 'Kırmızı-Deniz', type: 'diverging' },

  // Yeni Paletler
  teal: { name: 'Deniz Yeşili', type: 'sequential' },
  slate: { name: 'Arduvaz', type: 'sequential' },
  orange: { name: 'Turuncu', type: 'sequential' },
  tealPurple: { name: 'Mor-Yeşil', type: 'diverging' },
  redBlueDiverging: { name: 'Kırmızı-Mavi Ayrık', type: 'diverging' },
  tropicalBliss: { name: 'Boncuklu Pastel', type: 'sequential' },
  colorblindSafe: { name: 'Renk Körü Güvenli', type: 'sequential' },

  // Tek-Renk Skalalar
  blues: { name: 'Maviler', type: 'sequential' },
  reds: { name: 'Kırmızılar', type: 'sequential' },
  greens: { name: 'Yeşiller', type: 'sequential' },
  purples: { name: 'Morlar', type: 'sequential' },
  amber: { name: 'Kehribar', type: 'sequential' },

  // Yükseklik Paletleri
  elevationTerrain: { name: 'Yükseklik - Arazi', type: 'sequential' },
  elevationLand: { name: 'Yükseklik - Kara', type: 'sequential' },
  elevationAnalytic: { name: 'Yükseklik - Analitik', type: 'sequential' },
  elevationArctic: { name: 'Yükseklik - Arktik', type: 'sequential' },
}

/**
 * Color scheme list for UI selectors (ordered by type and preference)
 */
export const COLOR_SCHEME_LIST: { value: ColorScheme; label: string }[] = [
  // Sıralı — Tek-Renk (ColorBrewer)
  { value: 'blues', label: 'Maviler' },
  { value: 'reds', label: 'Kırmızılar' },
  { value: 'greens', label: 'Yeşiller' },
  { value: 'purples', label: 'Morlar' },
  { value: 'amber', label: 'Kehribar' },

  // Sıralı — Mavi/Yeşil ailesi
  { value: 'greenBlue', label: 'Yeşil-Mavi' },
  { value: 'teal', label: 'Deniz Yeşili' },
  { value: 'yellowGreen', label: 'Sarı-Yeşil' },
  { value: 'yellowBlue', label: 'Sarı-Mavi' },

  // Sıralı — Sıcak ailesi
  { value: 'sunset', label: 'Gün Batımı' },
  { value: 'orange', label: 'Turuncu' },

  // Sıralı — Pembe/Mor ailesi
  { value: 'pinkPurple', label: 'Pembe-Mor' },
  { value: 'rosePurple', label: 'Gül-Mor' },

  // Sıralı — Bilimsel
  { value: 'slate', label: 'Arduvaz' },
  { value: 'plasma', label: 'Plazma' },
  { value: 'viridis', label: 'Viridis' },

  // Sıralı — Yükseklik
  { value: 'elevationTerrain', label: 'Yükseklik - Arazi' },
  { value: 'elevationLand', label: 'Yükseklik - Kara' },
  { value: 'elevationAnalytic', label: 'Yükseklik - Analitik' },
  { value: 'elevationArctic', label: 'Yükseklik - Arktik' },

  // Kategorik
  { value: 'tropicalBliss', label: 'Boncuklu Pastel' },
  { value: 'colorblindSafe', label: 'Renk Körü Güvenli' },

  // Ayrık — Deniz ailesi
  { value: 'brownTeal', label: 'Kahve-Deniz' },
  { value: 'redTeal', label: 'Kırmızı-Deniz' },

  // Ayrık — Kırmızı ailesi
  { value: 'redBlue', label: 'Kırmızı-Mavi' },
  { value: 'redBlueDiverging', label: 'Kırmızı-Mavi Ayrık' },

  // Ayrık — Teal/Mor ailesi
  { value: 'tealPurple', label: 'Mor-Yeşil' },

  // Ayrık — Pembe ailesi
  { value: 'pinkGreen', label: 'Pembe-Yeşil' },
]

/**
 * Get color palette for a given class count
 * Uses Chroma.js for intelligent color sampling
 */
export function getColorPalette(colorScheme: ColorScheme, classCount: number): string[] {
  const fullPalette = COLOR_SCHEMES[colorScheme]

  if (classCount <= 1) return [fullPalette[0]]
  if (classCount >= fullPalette.length) return [...fullPalette]

  // Use Chroma.js for smooth color sampling
  return chroma.scale(fullPalette).mode('lab').colors(classCount)
}

/**
 * Get interpolated color palette with advanced color space support
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
 * Scale cache to avoid recreating scales on every call
 */
const scaleCache = new Map<string, chroma.Scale>()

/**
 * Get or create a cached Chroma.js scale
 */
function getColorScale(colorScheme: ColorScheme, colorSpace: ColorSpace = 'lab'): chroma.Scale {
  const mode = colorSpace === 'hcl' ? 'lch' : colorSpace
  const cacheKey = `${colorScheme}-${mode}`

  if (!scaleCache.has(cacheKey)) {
    const colors = COLOR_SCHEMES[colorScheme]
    const scale = chroma.scale(colors).mode(mode as chroma.InterpolationMode).domain([0, 1])
    scaleCache.set(cacheKey, scale)
  }

  return scaleCache.get(cacheKey)!
}

/**
 * Get continuous color for a normalized value (0-1)
 * Uses cached Chroma.js scale for smooth interpolation
 */
export function getContinuousColor(
  value: number,
  colorScheme: ColorScheme,
  colorSpace: ColorSpace = 'lab',
): string {
  const normalizedValue = Math.max(0, Math.min(1, value))
  const scale = getColorScale(colorScheme, colorSpace)
  return scale(normalizedValue).hex()
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
