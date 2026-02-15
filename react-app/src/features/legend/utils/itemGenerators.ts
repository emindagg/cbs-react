/**
 * Legend item generators for stepped and continuous scales
 */

import type { LegendConfiguration } from '@/types/visualization'
import type { NumberFormat } from '@/utils/numberFormatter'

export interface LegendItem {
  color: string
  label: string
}

export function generateSteppedItems(
  config: LegendConfiguration,
  colors: string[],
  breaks: number[],
  formatNumberFn: (value: number, format?: NumberFormat) => string,
): LegendItem[] {
  const items: LegendItem[] = []

  if (config.labels.type === 'custom' && config.labels.customLabels) {
    for (let i = 0; i < colors.length; i++) {
      items.push({
        color: colors[i],
        label: config.labels.customLabels[i] || '',
      })
    }
  } else if (config.labels.type === 'ruler') {
    for (let i = 0; i < breaks.length; i++) {
      const breakValue = breaks[i]
      if (breakValue !== undefined) {
        items.push({
          color: colors[Math.min(i, colors.length - 1)],
          label: formatNumberFn(breakValue, config.format as NumberFormat),
        })
      }
    }
  } else {
    for (let i = 0; i < colors.length; i++) {
      const lower = breaks[i]
      const upper = breaks[i + 1]
      let label = ''
      if (lower !== undefined && upper !== undefined) {
        const lowerFormatted = formatNumberFn(lower, config.format as NumberFormat)
        const upperFormatted = formatNumberFn(upper, config.format as NumberFormat)
        label = `${lowerFormatted} - ${upperFormatted}`
      }
      items.push({ color: colors[i], label })
    }
  }

  return items
}

export function generateContinuousItems(
  config: LegendConfiguration,
  colors: string[],
  breaks: number[],
  formatNumberFn: (value: number, format?: NumberFormat) => string,
): LegendItem[] {
  const items: LegendItem[] = []
  if (breaks.length < 2) return items

  const min = breaks[0]
  const max = breaks[breaks.length - 1]
  items.push({ color: colors[0], label: formatNumberFn(min, config.format as NumberFormat) })
  items.push({ color: colors[colors.length - 1], label: formatNumberFn(max, config.format as NumberFormat) })
  return items
}
