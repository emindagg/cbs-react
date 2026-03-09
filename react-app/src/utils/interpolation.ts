/**
 * Interpolation Methods
 * Continuous color scale interpolation
 * Handles break calculation, class counting, normalization
 */

import { calculateBreaks } from './classification'
import type { InterpolationMethod } from '../types/visualization'

/**
 * Calculate breaks using interpolation methods
 */
export function calculateBreaksFromInterpolation(
  values: number[],
  interpolation: InterpolationMethod,
): number[] {
  const sorted = [...values].sort((a, b) => a - b)

  switch (interpolation) {
    case 'equidistant':
      return calculateBreaks(sorted, 'equal', 5)
    case 'quantiles-4':
      return calculateBreaks(sorted, 'quantile', 4)
    case 'quantiles-5':
      return calculateBreaks(sorted, 'quantile', 5)
    case 'quantiles-10':
      return calculateBreaks(sorted, 'quantile', 10)
    case 'natural-9':
      return calculateBreaks(sorted, 'jenks', 9)
    default:
      return calculateBreaks(sorted, 'equal', 5)
  }
}

/**
 * Get number of classes from interpolation method
 */
export function getClassCountFromInterpolation(interpolation: InterpolationMethod): number {
  switch (interpolation) {
    case 'quantiles-4':
      return 4
    case 'quantiles-5':
      return 5
    case 'quantiles-10':
      return 10
    case 'natural-9':
      return 9
    default:
      return 5
  }
}

/**
 * Interpolation method metadata
 */
export const INTERPOLATION_INFO: Record<
  InterpolationMethod,
  { name: string; description: string; classes: number }
> = {
  'equidistant': {
    name: 'Doğrusal',
    description: 'Eşit aralıklarla değer dağılımı',
    classes: 5,
  },
  'quantiles-4': {
    name: 'Dörtlükler',
    description: 'Her sınıfta eşit sayıda gözlem (4 grup)',
    classes: 4,
  },
  'quantiles-5': {
    name: 'Beşlikler',
    description: 'Her sınıfta eşit sayıda gözlem (5 grup)',
    classes: 5,
  },
  'quantiles-10': {
    name: 'Onluklar',
    description: 'Her sınıfta eşit sayıda gözlem (10 grup)',
    classes: 10,
  },
  'natural-9': {
    name: 'Doğal Kırılmalar',
    description: 'Verideki doğal kümelenmelere göre (9 grup)',
    classes: 9,
  },
}

/**
 * Normalize value to 0-1 range for continuous interpolation.
 * Equidistant: linear (value-min)/(max-min).
 * Quantile/Natural: break tabanlı; her kırılım aralığında doğrusal interpolasyon.
 */
export function normalizeValue(
  value: number,
  min: number,
  max: number,
  interpolation: InterpolationMethod = 'equidistant',
  values?: number[],
): number {
  if (max === min) return 0.5

  if (interpolation === 'equidistant') {
    return (value - min) / (max - min)
  }

  if (values && values.length > 0 && (interpolation.startsWith('quantiles') || interpolation === 'natural-9')) {
    const breaks = calculateBreaksFromInterpolation(values, interpolation)
    if (breaks.length < 2) return (value - min) / (max - min)

    if (value <= breaks[0]) return 0
    if (value >= breaks[breaks.length - 1]) return 1

    let i = 0
    while (i < breaks.length - 1 && value >= breaks[i + 1]) i++
    if (i >= breaks.length - 1) return 1

    const segMin = breaks[i]
    const segMax = breaks[i + 1]
    const segSpan = segMax - segMin
    const tLocal = segSpan > 0 ? (value - segMin) / segSpan : 0
    const numSegments = breaks.length - 1
    return (i + tLocal) / numSegments
  }

  return (value - min) / (max - min)
}
